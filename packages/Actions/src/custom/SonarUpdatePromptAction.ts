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
        // Confused-deputy guard: the Update gate above is on AI Prompts, so the row we overwrite must
        // actually BE an AI prompt's content — otherwise this action would let a caller with prompt
        // rights rewrite ANY Template Content row (email templates, reports, ...) it names.
        const scopeError = await this.requirePromptContent(params, contentId);
        if (scopeError) {
            return scopeError;
        }
        try {
            const ok = await this.saveText(contentId, text ?? "", params.ContextUser);
            if (!ok) {
                return this.fail(params, "NOT_FOUND", `Template content '${contentId}' not found (or save failed).`);
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

    /** Verify the Template Content row belongs to an AI Prompt's template — Sonar: Get Prompt's
     *  prompt → TemplateID → content resolution, walked backwards. Returns a teaching failure when the
     *  row is missing or its Template is not referenced by any AI Prompt, else null. */
    private async requirePromptContent(params: RunActionParams, contentId: string): Promise<ActionResultSimple | null> {
        const cr = await new RunView().RunView<{ TemplateID: string | null }>(
            { EntityName: TEMPLATE_CONTENT, ExtraFilter: `ID='${this.sqlString(contentId)}'`, Fields: ["TemplateID"], MaxRows: 1, ResultType: "simple" },
            params.ContextUser,
        );
        const content = cr.Success ? cr.Results?.[0] : undefined;
        if (!content) {
            return this.fail(params, "NOT_FOUND", `Template content '${contentId}' not found.`);
        }
        const templateId = content.TemplateID;
        if (templateId) {
            const pr = await new RunView().RunView<{ ID: string }>(
                { EntityName: AI_PROMPT, ExtraFilter: `TemplateID='${this.sqlString(templateId)}'`, Fields: ["ID"], MaxRows: 1, ResultType: "simple" },
                params.ContextUser,
            );
            if (pr.Success && (pr.Results?.length ?? 0) > 0) {
                return null; // confirmed: this content row backs an AI Prompt
            }
        }
        return this.failWithFix(params, "VALIDATION_ERROR",
            `Template content '${contentId}' does not belong to an AI prompt, so this action cannot edit it.`,
            "pass the TemplateContentID returned by Sonar: Get Prompt.");
    }

    /** Load the template-content row, overwrite its text, save. */
    private async saveText(contentId: string, text: string, contextUser?: UserInfo): Promise<boolean> {
        const md = new Metadata();
        const content = await md.GetEntityObject<MJTemplateContentEntity>(TEMPLATE_CONTENT, contextUser);
        await content.Load(contentId);
        if (!content.IsSaved) return false;
        content.TemplateText = text;
        return content.Save();
    }

}
