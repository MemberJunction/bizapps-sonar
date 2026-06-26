import { RunView } from "@memberjunction/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseAction } from "@memberjunction/actions";
import { AIPromptRunner } from "@memberjunction/ai-prompts";
import { MJAIPromptEntityExtended } from "@memberjunction/ai-core-plus";
import {
    FactorActionContract,
    FactorComputeContext,
    FactorValue,
    SonarFactorAction,
    registerFactorAction,
} from "./SonarFactorAction";

const DRIVER_CLASS = "SonarReviewSentiment";
const SENTIMENT_PROMPT = "Sonar: Resource Review Sentiment";
const REVIEW_ENTITY = "Resource Reviews";

/** Self-description shown in the builder catalog + "what this signal does" panel. */
const CONTRACT: FactorActionContract = {
    measures: "How warm vs. frustrated a member's resource reviews read (LLM sentiment over the prose, not the star rating)",
    reads: ["Resource Reviews"],
    output: { min: 0, max: 1, higherIsBetter: true, sample: 0.8 },
    cost: { deterministic: false, externalCalls: true, expensive: true },
    promptName: SENTIMENT_PROMPT, // exposes the prompt for the builder's view/edit/test panel
};
registerFactorAction(DRIVER_CLASS, CONTRACT);

/** Shape the prompt is told to return (validated by AIPromptRunner against the prompt's OutputType). */
interface SentimentResult {
    score: number;
    reason: string;
}

/**
 * An LLM-backed factor (the tier the escape hatch exists for): reads a member's free-text resource
 * reviews and asks a model to rate engagement sentiment 0–1. SQL can average the star Rating; only an
 * LLM can read the *prose*. It satisfies the same SonarFactorAction contract as the streak factor, so
 * it flows through normalize → weight → band → explain unchanged — the `reason` lands in the
 * explainability waterfall, so it's an AI signal that isn't a black box.
 *
 * Cost is handled by the AIPrompt's own caching (same review text → cache hit, no re-call) + the
 * `null`-on-no-text short-circuit (silent members cost nothing). No AI credential / a model failure
 * degrades to no-data (null) with a clear explanation rather than crashing the run.
 */
@RegisterClass(BaseAction, DRIVER_CLASS)
export class SonarReviewSentimentAction extends SonarFactorAction {
    public readonly contract = CONTRACT;

    protected async computeValue(ctx: FactorComputeContext): Promise<FactorValue | null> {
        const reviews = await this.loadReviews(ctx);
        if (reviews.length === 0) {
            return null; // no text on file → no data (MissingDataPolicy handles it)
        }

        const prompt = await this.loadPrompt(ctx);
        if (!prompt) {
            return { value: null, explanation: `Scoring prompt '${SENTIMENT_PROMPT}' not found.` };
        }

        const runner = new AIPromptRunner();
        const result = await runner.ExecutePrompt<SentimentResult>({
            prompt,
            // Newest first, each tagged with its date — so the prompt's "weigh the most recent" is real.
            data: { reviews: reviews.map((r) => `- (${r.date}) ${r.text}`).join("\n") },
            contextUser: ctx.contextUser,
        });
        // A missing credential / model failure → no-data (null) with the reason, never a thrown run.
        if (!result.success || !result.result) {
            return { value: null, explanation: `AI unavailable: ${result.errorMessage ?? "no result"}` };
        }
        const score = this.clamp01(result.result.score);
        return { value: score, explanation: result.result.reason };
    }

    /** This member's non-empty review prose, newest first, each with its date (the baked source —
     *  disclosed via contract.reads). Dates let the prompt weigh recent tone over stale tone. */
    private async loadReviews(ctx: FactorComputeContext): Promise<Array<{ text: string; date: string }>> {
        const res = await new RunView().RunView<{ Review: string; CreatedDate: Date }>(
            {
                EntityName: REVIEW_ENTITY,
                ExtraFilter: `MemberID='${ctx.anchorRecordID}' AND Review IS NOT NULL AND LEN(Review) > 0 AND CreatedDate <= '${ctx.asOf.toISOString()}'`,
                Fields: ["Review", "CreatedDate"],
                OrderBy: "CreatedDate DESC",
                ResultType: "simple",
            },
            ctx.contextUser,
        );
        if (!res.Success) return [];
        return (res.Results ?? [])
            .filter((r) => !!r.Review)
            .map((r) => ({ text: r.Review, date: new Date(r.CreatedDate).toISOString().slice(0, 10) }));
    }

    /** Load the sentiment AIPrompt by name (its template + model pin + caching live in metadata). */
    private async loadPrompt(ctx: FactorComputeContext): Promise<MJAIPromptEntityExtended | null> {
        const res = await new RunView().RunView<MJAIPromptEntityExtended>(
            {
                EntityName: "MJ: AI Prompts",
                ExtraFilter: `Name='${SENTIMENT_PROMPT}'`,
                MaxRows: 1,
                ResultType: "entity_object",
            },
            ctx.contextUser,
        );
        return res.Success && res.Results?.[0] ? res.Results[0] : null;
    }

    private clamp01(n: number): number {
        if (!Number.isFinite(n)) return 0;
        return Math.min(1, Math.max(0, n));
    }
}
