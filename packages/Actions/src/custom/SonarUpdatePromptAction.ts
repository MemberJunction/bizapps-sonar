import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, UserInfo } from "@memberjunction/core";
import { MJTemplateContentEntity } from "@memberjunction/core-entities";

const TEMPLATE_CONTENT = "MJ: Template Contents";

/**
 * Sonar: Update Prompt — saves edited LLM prompt text from the factor builder's prompt panel.
 * Writes the new text onto the AIPrompt's TemplateContent row (resolved via Sonar: Get Prompt, which
 * hands the editor the TemplateContentID). NOTE: an AIPrompt is shared — editing it affects every
 * factor/use that references it.
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
