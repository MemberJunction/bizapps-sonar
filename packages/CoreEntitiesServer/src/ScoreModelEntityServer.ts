import {
    BaseEntity,
    EntitySaveOptions,
    Metadata,
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
    GUARDED_SCORE_MODEL_FIELDS,
} from "./publishLock";

/** Statuses whose config is frozen — mirrors publishLock.LOCKED_STATUSES (kept local to avoid widening
 *  that module's export surface for one hub-side check). */
const LOCKED_STATUSES: readonly string[] = ["Active", "Paused"];

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
        // bypass it. The publish path re-snapshots, so it's exempt; unpublishing (→ Draft) clears the lock.
        if (!publishing && this.isScoringEditLocked()) {
            return failPublishLock(this, "update");
        }

        if (!publishing) {
            return await super.Save(options);
        } else {
            return await this.publishWithSnapshot(options);
        }
    }

    /**
     * True when this save would mutate a frozen scoring field on a still-published model: current Status
     * is Active/Paused and at least one GUARDED_SCORE_MODEL_FIELDS field is dirty. Name/Description/owner/
     * scheduling fields stay editable; changing Status itself (e.g. unpublish → Draft) flips this.Status
     * out of the locked set, so a same-save unlock-and-edit is allowed.
     */
    private isScoringEditLocked(): boolean {
        if (!LOCKED_STATUSES.includes(this.Status)) {
            return false;
        }
        return GUARDED_SCORE_MODEL_FIELDS.some((f) => this.GetFieldByName(f)?.Dirty === true);
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
        // override is the actual enforcement). Skip on the publish transition, which re-snapshots.
        if (!this.isPublishTransition() && this.isScoringEditLocked()) {
            appendPublishLockFailure(result, "Status");
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
        const rv = new RunView();
        const [factorCheck, bandCheck] = await rv.RunViews(
            [
                {
                    EntityName: "MJ_BizApps_Sonar: Model Factors",
                    ExtraFilter: `ScoreModelID='${this.ID}'`,
                    MaxRows: 1,
                    ResultType: "simple",
                    Fields: ["ID"],
                },
                {
                    EntityName: "MJ_BizApps_Sonar: Score Bands",
                    ExtraFilter: this.BandSetID
                        ? `BandSetID='${this.BandSetID}'`
                        : "1=0",
                    MaxRows: 1,
                    ResultType: "simple",
                    Fields: ["ID"],
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

    /**
     * Publish path: freeze the current config into a new immutable version and make it
     * current atomically. The demote, the version insert, and the model update all
     * commit together via a single transaction group, or none of them do. This is what
     * removes the rollback hazard: a failed version insert can never leave the model
     * pointing at a demoted version (or at nothing).
     */
    private async publishWithSnapshot(
        options?: EntitySaveOptions,
    ): Promise<boolean> {
        // Publishability gate FIRST — before any snapshot or transaction work. Save() routes a
        // publish straight here, so the base flow's own ValidateAsync wouldn't fire until the
        // final super.Save() below, after the version rows are already queued. Running it here
        // means an invalid publish does no wasted work and queues nothing. On failure, route back
        // through the normal Save so the errors surface on LatestResult (and we never reach Submit).
        const validation = await this.ValidateAsync();
        if (!validation.Success) {
            return await super.Save(options);
        }

        // Gather everything we need to freeze BEFORE opening the transaction — these are
        // reads, and must not be part of the atomic write set.
        const snapshot = await this.buildConfigSnapshot();
        const nextVersionNumber = await this.nextVersionNumber();

        const md = new Metadata();
        const tg = await md.CreateTransactionGroup();

        // demote current version
        const pv = await this.loadPriorVersion();
        if (pv) {
            pv.TransactionGroup = tg;
            pv.IsCurrent = false;
            await pv.Save();
        }

        const version = await md.GetEntityObject<mjBizAppsSonarScoreModelVersionEntity>(
            "MJ_BizApps_Sonar: Score Model Versions",
            this.ContextCurrentUser,
        );
        version.NewRecord();
        version.ScoreModelID = this.ID;
        version.VersionNumber = nextVersionNumber;
        version.ConfigSnapshotJSON = snapshot;
        version.IsCurrent = true;
        if (this.ContextCurrentUser?.ID) {
            version.PublishedByUserID = this.ContextCurrentUser.ID;
        }

        version.TransactionGroup = tg;
        await version.Save();

        // update model's version to latest
        this.CurrentVersionID = version.ID;
        this.TransactionGroup = tg;
        const modelSaved = await super.Save(options);
        if (!modelSaved) {
            // The model's own save failed (e.g. validation at queue time) — do NOT submit the
            // queued demote + version insert, or we'd persist a half-published state.
            LogError(
                `ScoreModelEntityServer: model save failed during publish for ${this.ID}: ${
                    this.LatestResult?.CompleteMessage ?? "unknown"
                }`,
            );
            return false;
        }

        // complete atomic transaction for all changes
        const ok = await tg.Submit();
        if (!ok) {
            LogError(
                `ScoreModelEntityServer: publish transaction failed for ${
                    this.ID
                }: ${
                    this.LatestResult?.CompleteMessage ??
                    "see per-entity ResultHistory"
                }`,
            );
        }
        return ok;
    }

    /**
     * Load the model's current version (the one being superseded) by primary key.
     * Returns null on a brand-new model that has never been published.
     */
    private async loadPriorVersion(): Promise<mjBizAppsSonarScoreModelVersionEntity | null> {
        if (!this.CurrentVersionID) return null;
        const md = new Metadata();
        const v = await md.GetEntityObject<mjBizAppsSonarScoreModelVersionEntity>(
            "MJ_BizApps_Sonar: Score Model Versions",
            this.ContextCurrentUser,
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
        const rv = new RunView();
        const [related, modelFactors, bands] = await rv.RunViews(
            [
                {
                    EntityName: "MJ_BizApps_Sonar: Model Related Entities",
                    ExtraFilter: `ScoreModelID='${this.ID}'`,
                    ResultType: "entity_object",
                },
                {
                    EntityName: "MJ_BizApps_Sonar: Model Factors",
                    ExtraFilter: `ScoreModelID='${this.ID}'`,
                    ResultType: "entity_object",
                },
                {
                    EntityName: "MJ_BizApps_Sonar: Score Bands",
                    ExtraFilter: this.BandSetID
                        ? `BandSetID='${this.BandSetID}'`
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
        const rv = new RunView();
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
        const rv = new RunView();
        const result = await rv.RunView<mjBizAppsSonarScoreModelVersionEntity>(
            {
                EntityName: "MJ_BizApps_Sonar: Score Model Versions",
                ExtraFilter: `ScoreModelID='${this.ID}'`,
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
