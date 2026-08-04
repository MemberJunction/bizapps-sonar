import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, RunView, UserInfo } from "@memberjunction/core";
import { CommunicationEngine } from "@memberjunction/communication-engine";
import { Message, MessageRecipient } from "@memberjunction/communication-types";
import { mjBizAppsSonarScoreModelEntity } from "@mj-biz-apps/sonar-entities";

const SCORE_MODEL = "MJ_BizApps_Sonar: Score Models";
const DEFAULT_PROVIDER = "SendGrid";
const MESSAGE_TYPE = "Email";

/** One treated member as the runner's BulkSync path serializes it into CohortJSON. */
interface CohortMember {
    anchorRecordId: string;
    score?: number | null;
    bandId?: string | null;
}

/**
 * Sonar: Email Cohort — the second exit ramp for a group (Intervention.Kind='BulkSync'): hand the
 * whole treated cohort to **MJ Communications** as one message with per-recipient merge data.
 *
 * Sonar's job is to decide WHO needs attention and why; sending is MJ's. So this play owns no
 * transport, no queue and no retry logic — it resolves each member's address from the anchor entity,
 * builds one message, and lets `CommunicationEngine` do the rest through whichever provider is
 * configured. One message to many people (not one bespoke message each) because that's the shape of
 * a campaign, and because MJ renders the template per recipient from their ContextData.
 *
 * SAFE BY DEFAULT. `DryRun` defaults to TRUE, which routes through the framework's own
 * `previewOnly` path: everything is resolved and rendered, nothing leaves the building. That matters
 * here beyond the usual caution — demo anchors carry invented addresses, so a careless live run
 * would fire hundreds of bounces at a real sending reputation. `TestRecipient` is the other guard:
 * it redirects every message to one verified address, so a genuine send can be proven end to end
 * without touching members.
 *
 * Control members are never in CohortJSON (the runner excludes them), so the holdout can't be
 * contacted by construction.
 *
 * Input params:  CohortJSON / ModelID / InterventionID (runner-injected), Subject, Body,
 *                From, Provider?, DryRun?, TestRecipient?
 * Output param:  Result (JSON: { dryRun, provider, attempted, delivered, failed, skippedNoEmail,
 *                redirectedTo })
 */
@RegisterClass(BaseAction, "SonarEmailCohort")
export class SonarEmailCohortAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const cohort = this.parseJsonParam<CohortMember[]>(params, "CohortJSON");
        const modelId = this.getInput(params, "ModelID");
        const subject = this.getInput(params, "Subject");
        const body = this.getInput(params, "Body");
        const from = this.getInput(params, "From");
        if (!cohort || !Array.isArray(cohort) || !modelId) {
            return this.fail(params, "VALIDATION_ERROR", "CohortJSON (an array) and ModelID are required.");
        }
        if (!subject || !body) {
            return this.fail(params, "VALIDATION_ERROR", "Subject and Body are required — this play sends one message to the whole group.");
        }
        if (!from) {
            return this.fail(params, "VALIDATION_ERROR", "From is required: the address the message is sent from (must be verified with the provider).");
        }

        // Default to a preview. An operator has to ASK to send for real.
        const dryRun = (this.getInput(params, "DryRun") ?? "true").toLowerCase() !== "false";
        const providerName = this.getInput(params, "Provider") ?? DEFAULT_PROVIDER;
        const testRecipient = this.getInput(params, "TestRecipient");

        try {
            const anchorEntityId = await this.resolveAnchorEntity(modelId, params.ContextUser);
            if (!anchorEntityId) {
                return this.fail(params, "NOT_FOUND", `Score Model '${modelId}' not found (or has no anchor entity).`);
            }
            const people = await this.loadRecipientData(anchorEntityId, cohort, params.ContextUser);
            const recipients = this.buildRecipients(cohort, people, testRecipient);
            const skippedNoEmail = cohort.length - recipients.length;
            if (recipients.length === 0) {
                return this.fail(
                    params,
                    "NO_RECIPIENTS",
                    `None of the ${cohort.length} record(s) have an email address on the anchor record, so there is nobody to send to.`,
                );
            }

            const engine = CommunicationEngine.Instance;
            await engine.Config(false, params.ContextUser);
            const messageType = this.resolveMessageType(engine, providerName);
            if (!messageType) {
                return this.failWithFix(
                    params,
                    "PROVIDER_UNAVAILABLE",
                    `Provider '${providerName}' has no '${MESSAGE_TYPE}' message type registered.`,
                    `check the provider is Active in MJ and that its class is imported at server startup (apps/MJAPI/src/index.ts). Do NOT retry unchanged.`,
                );
            }

            const message = new Message();
            message.MessageType = messageType;
            message.From = from;
            message.Subject = subject;
            message.Body = body;

            const results = await engine.SendMessages(providerName, MESSAGE_TYPE, message, recipients, dryRun);
            const delivered = results.filter((r) => r.Success).length;
            const failed = results.length - delivered;
            const verb = dryRun ? "Previewed" : "Sent";
            const where = testRecipient ? ` (all redirected to ${testRecipient})` : "";
            return this.ok(
                params,
                `${verb} ${delivered} of ${recipients.length} message(s) via ${providerName}${where}` +
                    `${failed ? `, ${failed} failed` : ""}${skippedNoEmail ? `, ${skippedNoEmail} record(s) had no email` : ""}.` +
                    (dryRun ? " Dry run: nothing was actually sent." : ""),
                {
                    dryRun,
                    provider: providerName,
                    attempted: recipients.length,
                    delivered,
                    failed,
                    skippedNoEmail,
                    redirectedTo: testRecipient ?? null,
                    firstError: results.find((r) => !r.Success)?.Error ?? null,
                },
            );
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** The model's anchor entity — where a member's name and address live. */
    private async resolveAnchorEntity(modelId: string, contextUser?: UserInfo): Promise<string | null> {
        const model = await new Metadata().GetEntityObject<mjBizAppsSonarScoreModelEntity>(SCORE_MODEL, contextUser);
        await model.Load(modelId);
        return model.IsSaved ? model.AnchorEntityID : null;
    }

    /**
     * Name + email per anchor id, read in chunks straight off the anchor entity. Sonar stores no
     * contact details of its own, so this is always a read-through to the system of record.
     */
    private async loadRecipientData(
        anchorEntityId: string,
        cohort: CohortMember[],
        contextUser?: UserInfo,
    ): Promise<Map<string, { email: string | null; name: string | null }>> {
        const out = new Map<string, { email: string | null; name: string | null }>();
        const entity = new Metadata().Entities.find((e) => e.ID === anchorEntityId);
        if (!entity) return out;
        const pk = entity.FirstPrimaryKey?.Name ?? "ID";
        const hasField = (n: string) => entity.Fields.some((f) => f.Name === n);
        if (!hasField("Email")) return out; // no address on this anchor — caller reports it honestly

        const CHUNK = 200;
        const ids = cohort.map((c) => c.anchorRecordId);
        for (let i = 0; i < ids.length; i += CHUNK) {
            const list = ids.slice(i, i + CHUNK).map((id) => `'${this.sqlString(id)}'`).join(",");
            const res = await new RunView().RunView<Record<string, unknown>>(
                { EntityName: entity.Name, ExtraFilter: `${pk} IN (${list})`, ResultType: "simple", IgnoreMaxRows: true },
                contextUser,
            );
            for (const row of res.Success ? res.Results ?? [] : []) {
                const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
                const name = [str(row["FirstName"]), str(row["LastName"])].filter(Boolean).join(" ") || str(row["Name"]);
                out.set(String(row[pk]), { email: str(row["Email"]), name });
            }
        }
        return out;
    }

    /** One recipient per member with an address. ContextData is what MJ renders merge fields from,
     *  and it carries the SCORE FACTS so the message can say why this member is being contacted. */
    private buildRecipients(
        cohort: CohortMember[],
        people: Map<string, { email: string | null; name: string | null }>,
        testRecipient: string | null,
    ): MessageRecipient[] {
        const recipients: MessageRecipient[] = [];
        for (const member of cohort) {
            const person = people.get(member.anchorRecordId);
            if (!person?.email) continue; // no address: counted as skipped, never silently "sent"
            const r = new MessageRecipient();
            // A test recipient redirects the send; the merge data still describes the real member,
            // so a test proves what a member would actually receive.
            r.To = testRecipient ?? person.email;
            r.FullName = person.name ?? undefined;
            r.ContextData = {
                firstName: (person.name ?? "").split(/\s+/)[0] || "there",
                fullName: person.name ?? "",
                email: person.email,
                score: member.score ?? null,
            };
            recipients.push(r);
        }
        return recipients;
    }

    /** The provider's Email message type, as registered in MJ metadata. */
    private resolveMessageType(engine: CommunicationEngine, providerName: string) {
        const provider = engine.Providers.find((p) => p.Name === providerName);
        if (!provider) return undefined;
        return engine.ProviderMessageTypes.find(
            (t) => t.CommunicationProviderID === provider.ID && t.Name === MESSAGE_TYPE,
        );
    }
}
