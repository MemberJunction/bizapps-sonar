import { Component } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";
import { Metadata, UserInfo } from "@memberjunction/core";

/** The seeded Sonar Authoring Agent (Loop) — see scripts/seed-authoring-agent.mjs. */
const SONAR_AUTHORING_AGENT_ID = "CF1D58BA-451E-4515-89BD-AC3F16A19534";
/** MJ's single Default environment (this deployment has one). */
const DEFAULT_ENVIRONMENT_ID = "F51358F3-9447-4176-B313-BF8025FD8D09";
/** The BizAppSonar Application — scopes the agent's conversations to this app (not the main Chat list). */
const BIZAPPSONAR_APP_ID = "4F9477FB-BC8B-4CA9-A4FE-C0FB45496285";

/**
 * Assistant — a chat surface pinned to the Sonar Authoring Agent. Reuses MJ's conversation chat
 * UI (`<mj-conversation-chat-area>`, @memberjunction/ng-conversations); we don't build chat. The
 * chat-area self-manages the conversation (creates one on first message) and routes straight to our
 * agent (defaultAgentId + allowMentions/showAgentPicker off — no Sage layer). DriverClass =
 * 'SonarAssistantResource'. See plans/agentic-authoring.md §4c.
 */
@RegisterClass(BaseResourceComponent, "SonarAssistantResource")
@Component({
    standalone: false,
    selector: "sonar-assistant-resource",
    templateUrl: "./sonar-assistant-resource.component.html",
    styleUrls: ["../../shared/styles/sonar-shell.css", "./sonar-assistant-resource.component.css"],
})
export class SonarAssistantResourceComponent extends BaseResourceComponent {
    public readonly agentId = SONAR_AUTHORING_AGENT_ID;
    public readonly environmentId = DEFAULT_ENVIRONMENT_ID;
    public readonly applicationId = BIZAPPSONAR_APP_ID;

    /** Getter (not a field): Metadata.CurrentUser can be null at construction, before the provider
     *  finishes configuring — re-reading each change-detection cycle picks it up once ready. */
    public get currentUser(): UserInfo | null {
        return new Metadata().CurrentUser ?? null;
    }

    /** Signal load-complete immediately — there's no async data to fetch (the embedded chat-area
     *  owns its own lifecycle). Without this the Explorer's loading overlay never clears and the
     *  surface appears stuck. */
    public override ngOnInit(): void {
        super.ngOnInit();
        this.NotifyLoadComplete();
    }

    public async GetResourceDisplayName(_data: ResourceData): Promise<string> {
        return "Assistant";
    }
    public async GetResourceIconClass(_data: ResourceData): Promise<string> {
        return "fa-solid fa-wand-magic-sparkles";
    }
}
