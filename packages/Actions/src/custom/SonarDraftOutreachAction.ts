import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, RunView, UserInfo } from "@memberjunction/core";
import { AIEngine } from "@memberjunction/aiengine";
import { AIPromptRunner } from "@memberjunction/ai-prompts";
import {
    mjBizAppsSonarScoreModelEntity,
    mjBizAppsSonarInterventionProposalEntity,
} from "@mj-biz-apps/sonar-entities";

const SCORE_MODEL = "MJ_BizApps_Sonar: Score Models";
const SCORE = "MJ_BizApps_Sonar: Scores";
const SCORE_BAND = "MJ_BizApps_Sonar: Score Bands";
const CONTRIBUTION = "MJ_BizApps_Sonar: Score Factor Contributions";
const FACTOR = "MJ_BizApps_Sonar: Factors";
const PROPOSAL = "MJ_BizApps_Sonar: Intervention Proposals";

const PROMPT_NAME = "Sonar: Outreach Drafter";

/** One factor's part of the member's score story, as handed to the prompt and stored as grounding. */
interface GroundingFactor {
    label: string;
    normalizedValue: number;
    percentOfTotal: number;
    hadData: boolean;
    explanation: string | null;
}

/** The score facts a draft is grounded in — persisted verbatim on the proposal as the audit trail. */
interface Grounding {
    score: number;
    bandName: string | null;
    delta: number | null;
    dominantCause: string | null;
    factors: GroundingFactor[];
}

/** Everything the prompt needs about one member. */
interface MemberContext {
    memberName: string;
    recipientEmail: string | null;
    modelName: string;
    grounding: Grounding;
}

/** What the LLM is instructed to return (parsed defensively — see parseDraft). */
interface DraftOutput {
    subject?: string;
    body?: string;
    rationale?: string;
}

/**
 * Sonar: Draft Outreach — the first PER-MEMBER play (Intervention.Kind='Action') that produces a
 * reviewable artifact instead of firing at the world. For one treated member it loads the score
 * story (band, delta, factor contributions, dominant cause), has an AI Prompt write a short
 * personalized outreach message grounded in ONLY those facts, and persists it as an
 * InterventionProposal (Status='Proposed', ProposalType='EmailDraft') awaiting human review in the
 * Outreach queue. Nothing is sent anywhere — the play's entire side effect is one Sonar-owned row.
 *
 * The launch config points the params at runner tokens (AnchorRecordID='{{member}}',
 * InterventionID='{{interventionId}}', ModelID='{{modelId}}'), so each fire arrives here with real
 * ids. Idempotent per (InterventionID, AnchorRecordID): a re-fire returns the existing proposal
 * (and the table's unique constraint backstops races).
 *
 * Input params:  AnchorRecordID (req), InterventionID (req), ModelID (req)
 * Output param:  Result (Both, JSON: { proposalId, existing, subject })
 */
@RegisterClass(BaseAction, "SonarDraftOutreach")
export class SonarDraftOutreachAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const anchorId = this.getInput(params, "AnchorRecordID");
        const interventionId = this.getInput(params, "InterventionID");
        const modelId = this.getInput(params, "ModelID");
        if (!anchorId || !interventionId || !modelId) {
            return this.fail(params, "VALIDATION_ERROR", "AnchorRecordID, InterventionID and ModelID are all required.");
        }
        if (!this.isGuid(interventionId) || !this.isGuid(modelId)) {
            return this.fail(params, "VALIDATION_ERROR", "InterventionID and ModelID must be GUIDs.");
        }

        try {
            const existing = await this.existingProposalId(interventionId, anchorId, params.ContextUser);
            if (existing) {
                return this.ok(params, "A proposal already exists for this member — nothing re-drafted.", {
                    proposalId: existing,
                    existing: true,
                });
            }

            const context = await this.loadMemberContext(modelId, anchorId, params.ContextUser);
            if (!context) {
                return this.fail(params, "NOT_FOUND", `No score found for member '${anchorId}' on model '${modelId}'.`);
            }

            const draft = await this.draftWithPrompt(context, params.ContextUser);
            const proposalId = await this.saveProposal(interventionId, anchorId, context, draft, params.ContextUser);
            if (!proposalId) {
                return this.fail(params, "ERROR", "The drafted proposal could not be saved.");
            }
            return this.ok(params, `Drafted outreach for ${context.memberName}.`, {
                proposalId,
                existing: false,
                subject: draft.subject ?? null,
            });
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** The per-member idempotency guard (the unique constraint backstops races). */
    private async existingProposalId(
        interventionId: string,
        anchorId: string,
        contextUser?: UserInfo,
    ): Promise<string | null> {
        const res = await new RunView().RunView<{ ID: string }>(
            {
                EntityName: PROPOSAL,
                ExtraFilter: `InterventionID='${this.sqlString(interventionId)}' AND AnchorRecordID='${this.sqlString(anchorId)}'`,
                Fields: ["ID"],
                MaxRows: 1,
                ResultType: "simple",
            },
            contextUser,
        );
        return res.Success && res.Results?.[0] ? res.Results[0].ID : null;
    }

    /** Assemble the member's score story: identity from the anchor record, then the Score row, band
     *  name, and factor contributions. Null when the member has no score on this model. */
    private async loadMemberContext(
        modelId: string,
        anchorId: string,
        contextUser?: UserInfo,
    ): Promise<MemberContext | null> {
        const model = await new Metadata().GetEntityObject<mjBizAppsSonarScoreModelEntity>(SCORE_MODEL, contextUser);
        await model.Load(modelId);
        if (!model.IsSaved || !model.AnchorEntityID) return null;

        const score = await this.loadScoreRow(modelId, anchorId, contextUser);
        if (!score) return null;

        const [identity, bandName, factors] = await Promise.all([
            this.resolveMemberIdentity(model.AnchorEntityID, anchorId, contextUser),
            this.bandName(score.BandID, contextUser),
            this.loadGroundingFactors(score.ID, contextUser),
        ]);

        return {
            memberName: identity.name,
            recipientEmail: identity.email,
            modelName: model.Name,
            grounding: {
                score: score.NormalizedScore ?? 0,
                bandName,
                delta: score.Delta,
                dominantCause: this.dominantCause(factors),
                factors,
            },
        };
    }

    private async loadScoreRow(
        modelId: string,
        anchorId: string,
        contextUser?: UserInfo,
    ): Promise<{ ID: string; NormalizedScore: number | null; BandID: string | null; Delta: number | null } | null> {
        const res = await new RunView().RunView<{ ID: string; NormalizedScore: number | null; BandID: string | null; Delta: number | null }>(
            {
                EntityName: SCORE,
                ExtraFilter: `ScoreModelID='${this.sqlString(modelId)}' AND AnchorRecordID='${this.sqlString(anchorId)}'`,
                Fields: ["ID", "NormalizedScore", "BandID", "Delta"],
                MaxRows: 1,
                ResultType: "simple",
            },
            contextUser,
        );
        return res.Success && res.Results?.[0] ? res.Results[0] : null;
    }

    /** Server-side twin of the client's anchor-name resolution: IsNameField → FirstName+LastName →
     *  Name → Email → the raw id. Also surfaces an Email field when the anchor has one. */
    private async resolveMemberIdentity(
        anchorEntityId: string,
        anchorId: string,
        contextUser?: UserInfo,
    ): Promise<{ name: string; email: string | null }> {
        const entityInfo = new Metadata().Entities.find((e) => e.ID === anchorEntityId);
        if (!entityInfo) return { name: anchorId, email: null };
        const pk = entityInfo.FirstPrimaryKey?.Name ?? "ID";
        const res = await new RunView().RunView<Record<string, unknown>>(
            {
                EntityName: entityInfo.Name,
                ExtraFilter: `${pk}='${this.sqlString(anchorId)}'`,
                MaxRows: 1,
                ResultType: "simple",
            },
            contextUser,
        );
        const row = res.Success ? res.Results?.[0] : undefined;
        if (!row) return { name: anchorId, email: null };

        const str = (v: unknown): string | null => (typeof v === "string" && v.trim().length > 0 ? v.trim() : null);
        // FirstName+LastName beats the entity's single name field — on person-shaped anchors the
        // IsNameField is often just FirstName, and a draft addressed to a full name reads better.
        const nameFieldName = entityInfo.Fields.find((f) => f.IsNameField)?.Name;
        const fullName =
            str(row["FirstName"]) || str(row["LastName"])
                ? [str(row["FirstName"]), str(row["LastName"])].filter(Boolean).join(" ")
                : null;
        const name =
            fullName ??
            (nameFieldName ? str(row[nameFieldName]) : null) ??
            str(row["Name"]) ??
            str(row["Email"]) ??
            anchorId;
        return { name, email: str(row["Email"]) };
    }

    private async bandName(bandId: string | null, contextUser?: UserInfo): Promise<string | null> {
        if (!bandId) return null;
        const res = await new RunView().RunView<{ Label: string }>(
            { EntityName: SCORE_BAND, ExtraFilter: `ID='${this.sqlString(bandId)}'`, Fields: ["Label"], MaxRows: 1, ResultType: "simple" },
            contextUser,
        );
        return res.Success && res.Results?.[0] ? res.Results[0].Label : null;
    }

    /** The member's factor contributions with names + per-factor explanations, largest weight first.
     *  Server-side port of the client's contributionsForScore (score-read.service.ts). */
    private async loadGroundingFactors(scoreId: string, contextUser?: UserInfo): Promise<GroundingFactor[]> {
        const rowsRes = await new RunView().RunView<{
            FactorID: string;
            NormalizedValue: number | null;
            PercentOfTotal: number | null;
            WeightedContribution: number | null;
            HadData: boolean | null;
            DetailJSON: string | null;
        }>(
            {
                EntityName: CONTRIBUTION,
                ExtraFilter: `ScoreID='${this.sqlString(scoreId)}'`,
                Fields: ["FactorID", "NormalizedValue", "PercentOfTotal", "WeightedContribution", "HadData", "DetailJSON"],
                IgnoreMaxRows: true,
                ResultType: "simple",
            },
            contextUser,
        );
        const rows = rowsRes.Success ? (rowsRes.Results ?? []) : [];
        if (rows.length === 0) return [];

        const factorIds = [...new Set(rows.map((r) => `'${this.sqlString(r.FactorID)}'`))].join(",");
        const factorsRes = await new RunView().RunView<{ ID: string; Name: string }>(
            { EntityName: FACTOR, ExtraFilter: `ID IN (${factorIds})`, Fields: ["ID", "Name"], ResultType: "simple" },
            contextUser,
        );
        const nameById = new Map((factorsRes.Success ? (factorsRes.Results ?? []) : []).map((f) => [f.ID, f.Name]));

        return rows
            .map((r) => ({
                label: nameById.get(r.FactorID) ?? "Signal",
                normalizedValue: Math.max(0, Math.min(1, r.NormalizedValue ?? 0)),
                percentOfTotal: r.PercentOfTotal ?? 0,
                hadData: r.HadData ?? false,
                explanation: this.parseExplanation(r.DetailJSON),
                weighted: Math.abs(r.WeightedContribution ?? 0),
            }))
            .sort((a, b) => b.weighted - a.weighted)
            .map(({ weighted: _weighted, ...factor }) => factor);
    }

    /** The factor dragging the member down most: percentOfTotal × (1 − normalizedValue); no data =
     *  full shortfall. Server-side port of the client's dominantCauseForScores. */
    private dominantCause(factors: GroundingFactor[]): string | null {
        let worst: GroundingFactor | null = null;
        let worstDrag = -1;
        for (const f of factors) {
            const share = f.percentOfTotal > 0 ? f.percentOfTotal : 0;
            const shortfall = f.hadData ? 1 - f.normalizedValue : 1;
            const drag = share * shortfall;
            if (drag > worstDrag) {
                worstDrag = drag;
                worst = f;
            }
        }
        return worst && worstDrag > 0 ? (worst.hadData ? `Low ${worst.label}` : `No ${worst.label}`) : null;
    }

    /** The human "why" from a contribution's DetailJSON ({"explanation":"…"}). */
    private parseExplanation(detailJSON: string | null): string | null {
        if (!detailJSON) return null;
        try {
            const why = (JSON.parse(detailJSON) as { explanation?: unknown })?.explanation;
            return typeof why === "string" && why.length > 0 ? why : null;
        } catch {
            return null;
        }
    }

    /** Run the drafter prompt with the member's facts. The prompt is instructed to answer with strict
     *  JSON {subject, body, rationale}; parseDraft tolerates fences and falls back to raw text. */
    private async draftWithPrompt(context: MemberContext, contextUser?: UserInfo): Promise<DraftOutput> {
        await AIEngine.Instance.Config(false, contextUser);
        const prompt = AIEngine.Instance.Prompts.find((p) => p.Name === PROMPT_NAME);
        if (!prompt) {
            throw new Error(`AI Prompt '${PROMPT_NAME}' not found — has the Draft Outreach seed migration run?`);
        }
        const g = context.grounding;
        const factorLines = g.factors
            .map((f) => {
                const level = f.hadData ? `${Math.round(f.normalizedValue * 100)}/100 vs the group` : "no data";
                return `- ${f.label}: ${level} (${Math.round(f.percentOfTotal)}% of the score)${f.explanation ? ` — ${f.explanation}` : ""}`;
            })
            .join("\n");
        const result = await new AIPromptRunner().ExecutePrompt<DraftOutput>({
            prompt,
            contextUser,
            data: {
                memberName: context.memberName,
                modelName: context.modelName,
                bandName: g.bandName ?? "unknown",
                score: Math.round(g.score),
                delta: g.delta ?? 0,
                dominantCause: g.dominantCause ?? "an overall engagement decline",
                factorLines: factorLines || "- (no factor detail available)",
            },
        });
        if (!result.success) {
            throw new Error(`The drafter prompt failed: ${result.errorMessage ?? "unknown error"}`);
        }
        return this.parseDraft(result.result ?? result.rawResult);
    }

    /** Defensive parse of the LLM's reply: object as-is, JSON string (fences tolerated), or — when it
     *  isn't valid JSON at all — the whole text as the body so a review-able draft still lands. */
    private parseDraft(raw: unknown): DraftOutput {
        if (raw != null && typeof raw === "object") return raw as DraftOutput;
        const text = typeof raw === "string" ? raw.trim() : "";
        if (!text) return {};
        const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
        try {
            const parsed: unknown = JSON.parse(cleaned);
            if (parsed != null && typeof parsed === "object") return parsed as DraftOutput;
        } catch {
            // not JSON — fall through to raw-text body
        }
        return { body: text };
    }

    /** Persist the proposal row — the play's one side effect. */
    private async saveProposal(
        interventionId: string,
        anchorId: string,
        context: MemberContext,
        draft: DraftOutput,
        contextUser?: UserInfo,
    ): Promise<string | null> {
        const row = await new Metadata().GetEntityObject<mjBizAppsSonarInterventionProposalEntity>(PROPOSAL, contextUser);
        row.NewRecord();
        row.InterventionID = interventionId;
        row.AnchorRecordID = anchorId;
        row.AnchorName = context.memberName.slice(0, 300);
        row.ProposalType = "EmailDraft";
        row.Rationale = (draft.rationale ?? context.grounding.dominantCause ?? null)?.slice(0, 1000) ?? null;
        row.PayloadJSON = JSON.stringify({
            subject: draft.subject ?? `Checking in with ${context.memberName}`,
            body: draft.body ?? "",
            recipientEmail: context.recipientEmail,
        });
        row.GroundingJSON = JSON.stringify(context.grounding);
        row.Status = "Proposed";
        return (await row.Save()) ? row.ID : null;
    }
}
