import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { RunView, UserInfo } from "@memberjunction/core";

const AI_PROMPT = "MJ: AI Prompts";
const TEMPLATE_CONTENT = "MJ: Template Contents";

interface PromptRow { ID: string; TemplateID: string | null; }
interface ContentRow { ID: string; TemplateText: string | null; }

/**
 * Sonar: Get Prompt — reads an MJ AIPrompt's editable text for the factor builder's prompt panel.
 * An LLM-backed factor-action declares its prompt via `contract.promptName`; this resolves that name
 * to the prompt → its Template → the active TemplateContent (where the editable text lives) and
 * returns the text + the ids the editor needs to save back. Read-only.
 *
 * Input param:  PromptName (string — the registered AIPrompt Name)
 * Output param: Result (JSON: { promptId, templateContentId, text } or { error })
 */
@RegisterClass(BaseAction, "SonarGetPrompt")
export class SonarGetPromptAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const promptName = this.getInput(params, "PromptName");
        if (!promptName) {
            return this.fail(params, "VALIDATION_ERROR", "PromptName is required.");
        }
        try {
            const payload = await this.loadPrompt(promptName, params.ContextUser);
            return {
                Success: true,
                ResultCode: "SUCCESS",
                Message: payload.error ?? `Loaded prompt '${promptName}'.`,
                Params: [...params.Params, { Name: "Result", Value: JSON.stringify(payload), Type: "Both" }],
            };
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Resolve prompt name → template → active content text (+ ids). */
    private async loadPrompt(
        promptName: string,
        contextUser?: UserInfo,
    ): Promise<{ promptId: string | null; templateContentId: string | null; text: string; error?: string }> {
        const empty = { promptId: null, templateContentId: null, text: "" };
        const pr = await new RunView().RunView<PromptRow>(
            { EntityName: AI_PROMPT, ExtraFilter: `Name='${promptName.replace(/'/g, "''")}'`, Fields: ["ID", "TemplateID"], MaxRows: 1, ResultType: "simple" },
            contextUser,
        );
        const prompt = pr.Success ? pr.Results?.[0] : undefined;
        if (!prompt) return { ...empty, error: `Prompt '${promptName}' not found.` };
        if (!prompt.TemplateID) return { ...empty, promptId: prompt.ID, error: "Prompt has no template." };

        const cr = await new RunView().RunView<ContentRow>(
            { EntityName: TEMPLATE_CONTENT, ExtraFilter: `TemplateID='${prompt.TemplateID}'`, Fields: ["ID", "TemplateText"], OrderBy: "Priority ASC", MaxRows: 1, ResultType: "simple" },
            contextUser,
        );
        const content = cr.Success ? cr.Results?.[0] : undefined;
        if (!content) return { ...empty, promptId: prompt.ID, error: "Prompt template has no content row." };
        return { promptId: prompt.ID, templateContentId: content.ID, text: content.TemplateText ?? "" };
    }

}
