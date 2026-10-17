import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, RunView, UserInfo } from "@memberjunction/core";
import { MJTemplateContentEntity } from "@memberjunction/core-entities";

const TEMPLATE_CONTENT = "MJ: Template Contents";
const AI_PROMPT = "MJ: AI Prompts";

/**
 * Sonar: Update Prompt — saves edited LLM prompt text from the factor builder's prompt panel.
 * Writes the new text onto the AIPrompt's TemplateContent row (resolved via Sonar: Get Prompt, which
 * hands the editor the TemplateContentID). NOTE: an AIPrompt is shared — editing it affects every
 * factor/use that references it.
 *
 * Authorization: the write lands on a Template Content row, which is broadly writable (the UI role can
 * update it) and platform-shared — so permissions on the STORAGE row understate the real blast radius.
 * We gate on Update rights for 'MJ: AI Prompts' (the entity this conceptually edits), so only roles
 * allowed to change prompts can run it — not anyone who happens to be able to edit template content.
 *
 * Input params:  TemplateContentID (string), Text (string)
 * Output param:  Result (JSON: { templateContentId, saved })
 */
@RegisterClass(BaseAction, "SonarUpdatePrompt")
export class SonarUpdatePromptAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const contentId = this.getInput(params, "TemplateContentID");
        const text = this.getInput(params, "Text");
        if (!contentId) {
            return this.fail(params, "VALIDATION_ERROR", "TemplateContentID is required.");
        }
        if (!this.isGuid(contentId)) {
            return this.failWithFix(params, "VALIDATION_ERROR", `TemplateContentID '${contentId}' is not a valid GUID.`,
                "pass the TemplateContentID from Sonar: Get Prompt.");
        }
        // Gate on the prompt's permission, not the incidental Template Content storage row (see class doc).
        const authError = this.requireEntityUpdate(params, AI_PROMPT, "an AI prompt");
        if (authError) {
            return authError;
        }
        try {
            const content = await this.loadContent(contentId, params.ContextUser);
            if (!content) {
                return this.fail(params, "NOT_FOUND", `Template content '${contentId}' not found.`);
            }
            // The gate above authorizes editing AI PROMPTS — so the target row must actually BE a
            // prompt's storage. TemplateContentID is caller-supplied, and without this check the
            // action would write ANY template content (navigation emails, document templates, …)
            // under an authorization that was granted for prompts only.
            if (!(await this.promptReferencesTemplate(content.TemplateID, params.ContextUser))) {
                return this.failWithFix(params, "VALIDATION_ERROR",
                    `Template content '${contentId}' is not an AI prompt's template, so this action cannot edit it.`,
                    "pass the TemplateContentID that Sonar: Get Prompt returned.");
            }
            content.TemplateText = text ?? "";
            if (!(await content.Save())) {
                return this.fail(params, "ERROR", `Failed to save the prompt text: ${this.errOf(content)}`);
            }
            return {
                Success: true,
                ResultCode: "SUCCESS",
                Message: "Prompt updated.",
                Params: [...params.Params, { Name: "Result", Value: JSON.stringify({ templateContentId: contentId, saved: true }), Type: "Both" }],
            };
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Load the template-content row (null when it doesn't exist). */
    private async loadContent(contentId: string, contextUser?: UserInfo): Promise<MJTemplateContentEntity | null> {
        const md = new Metadata();
        const content = await md.GetEntityObject<MJTemplateContentEntity>(TEMPLATE_CONTENT, contextUser);
        await content.Load(contentId);
        return content.IsSaved ? content : null;
    }

    /** True when at least one AI Prompt references the template — i.e. the content row really is
     *  prompt storage, the object the Update gate authorized the caller to edit. */
    private async promptReferencesTemplate(templateId: string, contextUser?: UserInfo): Promise<boolean> {
        const res = await new RunView().RunView<{ ID: string }>(
            {
                EntityName: AI_PROMPT,
                ExtraFilter: `TemplateID='${this.sqlString(templateId)}'`,
                Fields: ["ID"],
                MaxRows: 1,
                ResultType: "simple",
            },
            contextUser,
        );
        return res.Success && (res.Results?.length ?? 0) > 0;
    }
}
