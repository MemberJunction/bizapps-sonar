import {
    BaseEntity,
    EntitySaveOptions,
    IMetadataProvider,
    RunView,
    RunViewResult,
    LogError,
} from "@memberjunction/core";
import {
    RegisterClass,
    ValidationResult,
    ValidationErrorInfo,
    ValidationErrorType,
} from "@memberjunction/global";
import {
    mjBizAppsSonarScoreModelEntity,
    mjBizAppsSonarScoreModelVersionEntity,
    mjBizAppsSonarModelFactorEntity,
    mjBizAppsSonarFactorEntity,
} from "@mj-biz-apps/sonar-entities";
import {
    appendPublishLockFailure,
    failPublishLock,
    isScoringEditBlocked,
    isInvalidArchiveTransition as isInvalidArchiveTransitionPure,
    sqlString,
} from "./publishLock";
import { describeCoverageProblem } from "./bandCoverage";
import { commitPublish, PublishTransactionProvider } from "./publishTransaction";

/**
 * Server-side subclass of the Sonar ScoreModel entity. Two lifecycle hooks:
 *
 * — **publish snapshot (Save):**
 * When a model transitions to `Status = 'Active'`, its full configuration is snapshotted
 * into a new, immutable `ScoreModelVersion`; that version is marked current and
 * `ScoreModel.CurrentVersionID` is pointed at it. This is what makes published scores
 * reproducible and auditable — every `Score` references the version that produced it,
 * so the rubric can change later without rewriting history.
 *
 * — **publishability gate (ValidateAsync):**
 * Blocks the transition to `Active` unless the model is actually scoreable (has a rubric
 * and bands). Runs before the snapshot, so an invalid publish never persists.
 */
@RegisterClass(BaseEntity, "MJ_BizApps_Sonar: Score Models")
export class ScoreModelEntityServer extends mjBizAppsSonarScoreModelEntity {
    /**
     * Entry point for every save. Routes a publish transition (→ Active) through the
     * snapshot path; all other saves fall through to the base implementation unchanged.
     */
    public override async Save(options?: EntitySaveOptions): Promise<boolean> {
        // Capture the publish transition BEFORE saving — super.Save() clears dirty flags.
        const publishing = this.isPublishTransition();

        // Hard invariant: editing the published model's OWN scoring fields drifts the live config away
        // from the snapshot. Block it here (in Save, not just ValidateAsync) so SkipAsyncValidation can't
        // bypass it. isScoringEditLocked() already exempts the publish transition (it re-snapshots) and a
        // same-save unpublish (→ Draft clears the lock), so the bare check is sufficient.
        if (this.isScoringEditLocked()) {
            return failPublishLock(this, "update");
        }

        // Hard invariant: only Draft models may be archived. Enforce in Save() so callers
        // that pass SkipAsyncValidation=true (e.g. bulk operations) can't bypass the gate.
        if (this.isInvalidArchiveTransition()) {
            return this.rejectArchiveTransition();
        }

        if (!publishing) {
            return await super.Save(options);
        } else {
            return await this.publishWithSnapshot(options);
        }
    }

    /**
     * True when this save would mutate a frozen scoring field on a still-published model. Delegates to
     * the pure {@link isScoringEditBlocked} rule (publish transition exempt; a same-save unpublish →
     * Draft is allowed because this.Status has flipped out of the locked set; only fields OUTSIDE the
     * editable allowlist trip it — safe-by-default). Reads the dirty set straight off the entity fields.
     */
    private isScoringEditLocked(): boolean {
        return isScoringEditBlocked({
            status: this.Status,
            publishing: this.isPublishTransition(),
            dirtyFields: this.Fields.filter((f) => f.Dirty).map((f) => f.Name),
        });
    }

    /**
     * BaseEntity skips async validation by default (DefaultSkipAsyncValidation === true),
     * so an overridden ValidateAsync() would never run on a normal Save(). Opt this entity
     * in so the publishability gate below actually fires.
     */
    public override get DefaultSkipAsyncValidation(): boolean {
        return false;
    }

    /**
     * Publishability gate. A model may only go Active if it is actually scoreable. These
     * are cross-record rules (they count rows in other tables), which a column CHECK can't
     * express — so they live here. It runs on every save (the base flow calls it after the
     * synchronous Validate), and `publishWithSnapshot` ALSO invokes it explicitly up front so
     * an invalid publish fails before any snapshot/transaction work. Non-Active saves skip
     * the extra queries entirely.
     */
    public override async ValidateAsync(): Promise<ValidationResult> {
        const result = await super.ValidateAsync();
        if (this.Status === "Active") {
            await this.validatePublishable(result);
        }
        // Friendly message for the interactive path when editing a frozen scoring field (the Save()
        // override is the actual enforcement). isScoringEditLocked() already exempts the publish
        // transition, so no separate guard is needed here.
        if (this.isScoringEditLocked()) {
            appendPublishLockFailure(result, "Status");
        }
        // Archive gate: only Draft models may be archived. The Save() override is the hard block;
        // this surfaces a clear error message through the normal validation path.
        if (this.isInvalidArchiveTransition()) {
            const from = String(this.GetFieldByName("Status")?.OldValue ?? "unknown");
            this.addFailure(
                result,
                "Status",
                `Cannot archive a model that is currently '${from}'. Unpublish it to Draft first.`,
            );
        }
        return result;
    }

    /**
     * Runs the individual publishability checks and appends a failure for each one that
     * is unmet: at least one ModelFactor (a rubric), a band set that actually has bands,
     * and a CombineExpression whenever the strategy is 'ExpressionDriven'. Uses a single
     * batched existence query (MaxRows:1) for the cross-record checks.
     */
    private async validatePublishable(result: ValidationResult): Promise<void> {
        const rv = this.runView();
        const [factorCheck, bandCheck] = await rv.RunViews(
            [
                {
                    EntityName: "MJ_BizApps_Sonar: Model Factors",
                    ExtraFilter: `ScoreModelID='${sqlString(this.ID)}'`,
                    MaxRows: 1,
                    ResultType: "simple",
                    Fields: ["ID"],
                },
                {
                    // All bands (not just one): publishing also checks the set TILES the model's
                    // scale, which needs every row's range, not merely proof that a band exists.
                    EntityName: "MJ_BizApps_Sonar: Score Bands",
                    ExtraFilter: this.BandSetID
                        ? `BandSetID='${sqlString(this.BandSetID)}'`
                        : "1=0",
                    ResultType: "simple",
                    Fields: ["ID", "Label", "MinScore", "MaxScore"],
                },
            ],
            this.ContextCurrentUser,
        );

        if (!this.hasRows(factorCheck)) {
            this.addFailure(
                result,
                "ModelFactors",
                "A model needs at least one factor before it can be published.",
            );
        }
        if (!this.BandSetID) {
            this.addFailure(
                result,
                "BandSetID",
                "A model needs a score band set before it can be published.",
            );
        } else if (!this.hasRows(bandCheck)) {
            this.addFailure(
                result,
                "BandSetID",
                "The selected score band set has no bands.",
            );
        } else {
            // The set exists and has bands — now make sure it actually COVERS the scale. A gap means
            // scores there get no band at all (they drop out of the distribution, triage and movers);
            // an overlap means two bands claim them and order decides. Either way the published
            // snapshot would encode a set the engine can't band consistently, so block the publish.
            const problem = describeCoverageProblem(
                (bandCheck.Results ?? []).map((b) => ({
                    label: String((b as { Label?: unknown }).Label ?? "(band)"),
                    minScore: Number((b as { MinScore?: unknown }).MinScore ?? 0),
                    maxScore: Number((b as { MaxScore?: unknown }).MaxScore ?? 0),
                })),
                { min: this.ScoreScaleMin ?? 0, max: this.ScoreScaleMax ?? 100 },
            );
            if (problem) {
                this.addFailure(result, "BandSetID", `Score bands don't cover the score range. ${problem}`);
            }
        }
        if (
            this.CombineStrategy === "ExpressionDriven" &&
            !this.CombineExpression?.trim()
        ) {
            this.addFailure(
                result,
                "CombineExpression",
                "CombineExpression is required when CombineStrategy is 'ExpressionDriven'.",
            );
        }
        await this.validateActionFactorsApproved(result);
    }

    /**
     * Publishability check: every Action-backed factor in the rubric must be `PromotionState='Approved'`.
     * Closes the governance gap (PR review #2) where a model with a Draft action factor could be published
     * and then throw on EVERY persisted recompute — the engine's persist path requires Approved action
     * factors (RecomputeOrchestrator), and that failure would otherwise surface at run time, not publish
     * time. Enforcing it here keeps the two consistent: if it published, a recompute won't fail the whole
     * run on an un-promoted action factor.
     *
     * All-or-nothing is intentional (matches the engine): silently EXCLUDING an un-approved factor would
     * change the model's scoring behind the operator's back. The gate is loud, not lossy — approve the
     * factor or remove it from the rubric.
     */
    private async validateActionFactorsApproved(result: ValidationResult): Promise<void> {
        const rv = this.runView();
        const rubric = await rv.RunView<{ FactorID: string }>(
            {
                EntityName: "MJ_BizApps_Sonar: Model Factors",
                ExtraFilter: `ScoreModelID='${sqlString(this.ID)}'`,
                Fields: ["FactorID"],
                ResultType: "simple",
            },
            this.ContextCurrentUser,
        );
        const ids = (rubric.Results ?? []).map((r) => r.FactorID).filter(Boolean);
        if (ids.length === 0) {
            return; // no rubric → the factor-count check above already blocks the publish
        }
        const idList = ids.map((id) => `'${id}'`).join(",");
        const unapproved = await rv.RunView<{ Name: string }>(
            {
                EntityName: "MJ_BizApps_Sonar: Factors",
                ExtraFilter:
                    `ID IN (${idList}) AND FactorType='ActionBacked' ` +
                    `AND (PromotionState IS NULL OR PromotionState <> 'Approved')`,
                Fields: ["Name"],
                ResultType: "simple",
            },
            this.ContextCurrentUser,
        );
        const names = (unapproved.Results ?? []).map((r) => r.Name);
        if (names.length > 0) {
            this.addFailure(
                result,
                "ModelFactors",
                `Every action-backed factor must be Approved before publishing — not yet approved: ${names.join(", ")}. ` +
                    `Approve them (or remove them from the rubric); otherwise a published model would fail every recompute.`,
            );
        }
    }

    /** True when an existence-check view (MaxRows:1) returned at least one row. */
    private hasRows(viewResult: RunViewResult): boolean {
        return viewResult?.Success === true && (viewResult.Results?.length ?? 0) > 0;
    }

    /** Mark the result failed and attach one error (Source/Message surface in Explorer). */
    private addFailure(
        result: ValidationResult,
        source: string,
        message: string,
    ): void {
        result.Success = false;
        result.Errors.push(
            new ValidationErrorInfo(
                source,
                message,
                null,
                ValidationErrorType.Failure,
            ),
        );
    }

    /** True only when this save flips Status to 'Active' (e.g. Draft/Paused → Active). */
    private isPublishTransition(): boolean {
        const statusDirty = this.GetFieldByName("Status")?.Dirty === true;
        return statusDirty && this.Status === "Active";
    }

    /** True when this save transitions Status to 'Archived' from a non-Draft state.
     *  Only Draft → Archived is permitted; Active → Archived must go via Draft first. */
    private isInvalidArchiveTransition(): boolean {
        const statusField = this.GetFieldByName("Status");
        return isInvalidArchiveTransitionPure({
            newStatus: this.Status,
            previousStatus: String(statusField?.OldValue ?? ""),
            statusDirty: statusField?.Dirty === true,
        });
    }

    /** Populate LatestResult with a rejection message and return false — same contract as failPublishLock(). */
    private rejectArchiveTransition(): boolean {
        const from = String(this.GetFieldByName("Status")?.OldValue ?? "unknown");
        const message = `Cannot archive a model that is currently '${from}'. Unpublish it to Draft first, then archive.`;
        LogError(`ScoreModelEntityServer: rejected invalid archive transition for ${this.ID}: ${message}`);
        return false;
    }

    /**
     * Publish path: freeze the current config into a new immutable version and make it current
     * atomically. The demote, the version insert, and the model update commit together or not at
     * all — and they do so inside the CALLER's transaction (see {@link commitPublish}), so an outer
     * unit of work that fails after this publish (e.g. a `mj sync push`) rolls the publish back too.
     */
    private async publishWithSnapshot(
        options?: EntitySaveOptions,
    ): Promise<boolean> {
        // Publishability gate FIRST — before any snapshot or transaction work. Save() routes a
        // publish straight here, so the base flow's own ValidateAsync wouldn't fire until the
        // final super.Save() below. On failure, route back through the normal Save so the errors
        // surface on LatestResult.
        const validation = await this.ValidateAsync();
        if (!validation.Success) {
            return await super.Save(options);
        }

        // Reads first (outside the write scope), on this entity's own provider so they see the
        // caller's uncommitted rubric rows (read-your-writes inside a push transaction).
        const snapshot = await this.buildConfigSnapshot();
        const nextVersionNumber = await this.nextVersionNumber();
        const priorVersion = await this.loadPriorVersion();
        const version = await this.newVersionRecord(snapshot, nextVersionNumber);
        if (priorVersion) {
            priorVersion.IsCurrent = false;
        }

        const previousPointer = this.CurrentVersionID;
        const outcome = await commitPublish(this.ProviderToUse as PublishTransactionProvider, {
            priorVersion,
            newVersion: version,
            saveModel: async () => {
                this.CurrentVersionID = version.ID;
                const saved = await super.Save(options);
                return { ok: saved, message: this.LatestResult?.CompleteMessage };
            },
        });
        if (outcome.status === "rolledBack") {
            // The scope rolled back — don't leave this instance pointing at a version that no longer exists.
            this.CurrentVersionID = previousPointer;
            LogError(`ScoreModelEntityServer: publish rolled back for ${this.ID}: ${outcome.error}`);
            return false;
        }
        return true;
    }

    /** An unsaved ScoreModelVersion carrying the snapshot, created on this entity's provider. */
    private async newVersionRecord(
        snapshot: string,
        versionNumber: number,
    ): Promise<mjBizAppsSonarScoreModelVersionEntity> {
        const version = await this.sameProviderEntity<mjBizAppsSonarScoreModelVersionEntity>(
            "MJ_BizApps_Sonar: Score Model Versions",
        );
        version.NewRecord();
        version.ScoreModelID = this.ID;
        version.VersionNumber = versionNumber;
        version.ConfigSnapshotJSON = snapshot;
        version.IsCurrent = true;
        if (this.ContextCurrentUser?.ID) {
            version.PublishedByUserID = this.ContextCurrentUser.ID;
        }
        return version;
    }

    /**
     * An entity object on THIS entity's provider (not the global default), so its save joins the
     * same connection and transaction. The cast is the one BaseEntity itself uses for child
     * entities: a provider that saves entities is also the metadata provider that creates them.
     */
    private async sameProviderEntity<T extends BaseEntity>(entityName: string): Promise<T> {
        const provider = this.ProviderToUse as unknown as IMetadataProvider;
        return provider.GetEntityObject<T>(entityName, this.ContextCurrentUser);
    }

    /** A RunView bound to this entity's provider (read-your-writes inside the caller's transaction). */
    private runView(): RunView {
        return new RunView(this.RunViewProviderToUse);
    }

    /**
     * Load the model's current version (the one being superseded) by primary key.
     * Returns null on a brand-new model that has never been published.
     */
    private async loadPriorVersion(): Promise<mjBizAppsSonarScoreModelVersionEntity | null> {
        if (!this.CurrentVersionID) return null;
        const v = await this.sameProviderEntity<mjBizAppsSonarScoreModelVersionEntity>(
            "MJ_BizApps_Sonar: Score Model Versions",
        );
        const loaded = await v.Load(this.CurrentVersionID);
        return loaded ? v : null;
    }

    /**
     * Build the fully-denormalized config snapshot: the model's own fields plus its
     * related-entity map, rubric (model factors + the factors they bind), and bands.
     * The engine can score from this JSON alone.
     */
    private async buildConfigSnapshot(): Promise<string> {
        const rv = this.runView();
        const [related, modelFactors, bands] = await rv.RunViews(
            [
                {
                    EntityName: "MJ_BizApps_Sonar: Model Related Entities",
                    ExtraFilter: `ScoreModelID='${sqlString(this.ID)}'`,
                    ResultType: "entity_object",
                },
                {
                    EntityName: "MJ_BizApps_Sonar: Model Factors",
                    ExtraFilter: `ScoreModelID='${sqlString(this.ID)}'`,
                    ResultType: "entity_object",
                },
                {
                    EntityName: "MJ_BizApps_Sonar: Score Bands",
                    ExtraFilter: this.BandSetID
                        ? `BandSetID='${sqlString(this.BandSetID)}'`
                        : "1=0",
                    ResultType: "entity_object",
                },
            ],
            this.ContextCurrentUser,
        );

        const modelFactorRows = (modelFactors.Results ??
            []) as mjBizAppsSonarModelFactorEntity[];
        const factors = await this.loadBoundFactors(modelFactorRows);

        const config = {
            model: this.GetAll(),
            relatedEntities: (related.Results ?? []).map((r: BaseEntity) =>
                r.GetAll(),
            ),
            modelFactors: modelFactorRows.map((mf) => mf.GetAll()),
            factors: factors.map((f) => f.GetAll()),
            bands: (bands.Results ?? []).map((b: BaseEntity) => b.GetAll()),
        };
        return JSON.stringify(config);
    }

    /** Load the Factor rows referenced by the model's rubric (its ModelFactor rows). */
    private async loadBoundFactors(
        modelFactors: mjBizAppsSonarModelFactorEntity[],
    ): Promise<mjBizAppsSonarFactorEntity[]> {
        if (modelFactors.length === 0) {
            return [];
        }
        const idList = modelFactors.map((mf) => `'${mf.FactorID}'`).join(",");
        const rv = this.runView();
        const result = await rv.RunView<mjBizAppsSonarFactorEntity>(
            {
                EntityName: "MJ_BizApps_Sonar: Factors",
                ExtraFilter: `ID IN (${idList})`,
                ResultType: "entity_object",
            },
            this.ContextCurrentUser,
        );
        return result.Success ? result.Results ?? [] : [];
    }

    /** Next monotonic version number for this model (max existing + 1). */
    private async nextVersionNumber(): Promise<number> {
        const rv = this.runView();
        const result = await rv.RunView<mjBizAppsSonarScoreModelVersionEntity>(
            {
                EntityName: "MJ_BizApps_Sonar: Score Model Versions",
                ExtraFilter: `ScoreModelID='${sqlString(this.ID)}'`,
                OrderBy: "VersionNumber DESC",
                MaxRows: 1,
                ResultType: "entity_object",
            },
            this.ContextCurrentUser,
        );
        const latest = result.Success ? result.Results?.[0] : undefined;
        return (latest?.VersionNumber ?? 0) + 1;
    }
}
