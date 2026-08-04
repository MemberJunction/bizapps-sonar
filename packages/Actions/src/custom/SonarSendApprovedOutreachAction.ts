import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, RunView, UserInfo } from "@memberjunction/core";
import { CommunicationEngine } from "@memberjunction/communication-engine";
import { Message } from "@memberjunction/communication-types";
import { mjBizAppsSonarInterventionProposalEntity } from "@mj-biz-apps/sonar-entities";

const PROPOSAL = "MJ_BizApps_Sonar: Intervention Proposals";
const DEFAULT_PROVIDER = "SendGrid";
const MESSAGE_TYPE = "Email";

/** The draft a reviewer approved, as `Sonar: Draft Outreach` stored it. */
interface DraftPayload {
    subject?: string | null;
    body?: string | null;
    recipientEmail?: string | null;
}

/** One approved proposal, ready to send. */
interface ApprovedDraft {
    id: string;
    anchorName: string | null;
    subject: string;
    body: string;
    email: string;
}

/**
 * Sonar: Send Approved Outreach — the last step of the draft-outreach loop, through
 * **MJ Communications**.
 *
 * Until now "Send approved" only flipped a status and called itself simulated. This actually hands
 * each approved draft to `CommunicationEngine`.
 *
 * ## Why not reuse `Sonar: Email Cohort`
 *
 * That play calls `SendMessages(provider, type, message, recipients[])` — ONE subject and body
 * rendered across many recipients with merge fields. That is the shape of a campaign.
 *
 * These drafts are the opposite: an LLM wrote each one from that member's own score story, so every
 * proposal has its own subject and body and there is nothing to merge. `SendSingleMessage` is the
 * matching primitive — one Message carrying its own To/Subject/Body — so this sends per proposal.
 * That costs one provider call each, which is the correct trade for individually-written mail and
 * is bounded by however many a human actually approved.
 *
 * ## Safety, because this is the first Sonar code that can reach a real person
 *
 * Everything before this could, at worst, write a wrong row. Past this point the worst case is real
 * mail to real members, so the guards are deliberate rather than cautious:
 *
 * - `DryRun` defaults to **TRUE**, routing through the framework's own `previewOnly` path: every
 *   message is resolved and rendered, nothing leaves the building. Sending requires asking.
 * - `TestRecipient` redirects every message to one verified address, so a genuine live send can be
 *   proven end to end without contacting a member.
 * - Only `Approved` proposals are eligible. A draft nobody read cannot be sent.
 * - Success moves the row to `Executed`, so **re-running cannot double-send**. Idempotency comes
 *   from the status filter rather than from bookkeeping this action has to get right.
 * - A failure leaves the row `Approved` on purpose, so a retry picks it up rather than losing it.
 *
 * Control-group members never had a proposal drafted (the runner excludes them), so the holdout
 * cannot be contacted by construction.
 *
 * Input params:  InterventionID, From, Provider?, DryRun?, TestRecipient?
 * Output param:  Result (JSON: { dryRun, provider, approved, sent, failed, skippedNoEmail,
 *                redirectedTo, firstError })
 */
@RegisterClass(BaseAction, "SonarSendApprovedOutreach")
export class SonarSendApprovedOutreachAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const interventionId = this.getInput(params, "InterventionID");
        const from = this.getInput(params, "From");
        if (!interventionId || !this.isGuid(interventionId)) {
            return this.fail(params, "VALIDATION_ERROR", "InterventionID is required and must be a GUID.");
        }
        if (!from) {
            return this.fail(
                params,
                "VALIDATION_ERROR",
                "From is required: the address the message is sent from (must be verified with the provider).",
            );
        }

        // Default to a preview. An operator has to ASK to send for real.
        const dryRun = (this.getInput(params, "DryRun") ?? "true").toLowerCase() !== "false";
        const providerName = this.getInput(params, "Provider") ?? DEFAULT_PROVIDER;
        const testRecipient = this.getInput(params, "TestRecipient");

        try {
            const { drafts, skippedNoEmail, approved } = await this.loadApproved(interventionId, params.ContextUser);
            if (approved === 0) {
                return this.ok(params, "No approved drafts to send for this intervention.", {
                    dryRun, provider: providerName, approved: 0, sent: 0, failed: 0, skippedNoEmail: 0,
                    redirectedTo: testRecipient ?? null, firstError: null,
                });
            }
            if (drafts.length === 0) {
                return this.fail(
                    params,
                    "NO_RECIPIENTS",
                    `All ${approved} approved draft(s) are missing a recipient address, so there is nobody to send to.`,
                );
            }

            const engine = CommunicationEngine.Instance;
            await engine.Config(false, params.ContextUser);
            const messageType = this.resolveMessageType(engine, providerName);
            if (!messageType) {
                return this.failWithFix(
                    params,
                    "PROVIDER_UNAVAILABLE",
                    `Provider '${providerName}' has no '${MESSAGE_TYPE}' message type registered in MJ metadata.`,
                    `check the provider row is Active in MJ. Do NOT retry unchanged.`,
                );
            }
            // Metadata and RUNTIME registration are different things, and only checking the first is how
            // this surfaced as a deep "Provider SendGrid not found." from inside the engine instead of
            // something actionable. The provider CLASS has to be imported at server startup too.
            if (!engine.GetProvider(providerName)) {
                return this.failWithFix(
                    params,
                    "PROVIDER_UNAVAILABLE",
                    `Provider '${providerName}' is registered in metadata but its implementation class is not loaded.`,
                    `import the provider package at server startup (apps/MJAPI/src/index.ts imports '@memberjunction/communication-sendgrid'). Restart the API afterwards. Do NOT retry unchanged.`,
                );
            }

            let sent = 0;
            let failed = 0;
            let firstError: string | null = null;
            for (const draft of drafts) {
                const message = new Message();
                message.MessageType = messageType;
                message.From = from;
                message.To = testRecipient ?? draft.email;
                message.Subject = draft.subject;
                message.Body = draft.body;

                let ok = false;
                try {
                    const result = await engine.SendSingleMessage(providerName, MESSAGE_TYPE, message, undefined, dryRun);
                    ok = !!result?.Success;
                    if (!ok && !firstError) firstError = result?.Error ?? "unknown provider error";
                } catch (e: unknown) {
                    if (!firstError) firstError = e instanceof Error ? e.message : String(e);
                }

                if (!ok) {
                    // Leave it Approved so a retry can pick it up; losing it would be worse than repeating it.
                    failed++;
                    continue;
                }
                sent++;
                // A dry run must NOT mark anything Executed, or the next real run would skip it.
                if (!dryRun) await this.markExecuted(draft.id, params.ContextUser);
            }

            const verb = dryRun ? "Previewed" : "Sent";
            const where = testRecipient ? ` (all redirected to ${testRecipient})` : "";
            return this.ok(
                params,
                `${verb} ${sent} of ${drafts.length} approved draft(s) via ${providerName}${where}` +
                    `${failed ? `, ${failed} failed` : ""}` +
                    `${skippedNoEmail ? `, ${skippedNoEmail} had no recipient address` : ""}.` +
                    (dryRun ? " Dry run: nothing was actually sent, and nothing was marked Executed." : ""),
                {
                    dryRun, provider: providerName, approved,
                    sent, failed, skippedNoEmail,
                    redirectedTo: testRecipient ?? null, firstError,
                },
            );
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Approved proposals for this intervention, with their payloads parsed and addressed. */
    private async loadApproved(
        interventionId: string,
        contextUser: UserInfo,
    ): Promise<{ drafts: ApprovedDraft[]; skippedNoEmail: number; approved: number }> {
        const res = await new RunView().RunView<{
            ID: string; AnchorName: string | null; PayloadJSON: string | null;
        }>(
            {
                EntityName: PROPOSAL,
                // Only Approved. A draft nobody reviewed is not sendable, and Executed is already done.
                ExtraFilter: `InterventionID='${this.sqlString(interventionId)}' AND Status='Approved'`,
                Fields: ["ID", "AnchorName", "PayloadJSON"],
                IgnoreMaxRows: true,
                ResultType: "simple",
            },
            contextUser,
        );
        const rows = res.Success ? res.Results ?? [] : [];
        const drafts: ApprovedDraft[] = [];
        for (const row of rows) {
            const payload = this.parsePayload(row.PayloadJSON);
            const email = (payload?.recipientEmail ?? "").trim();
            const subject = (payload?.subject ?? "").trim();
            const body = (payload?.body ?? "").trim();
            // No address, or nothing to say, means nothing to send — counted, not silently dropped.
            if (!email || !subject || !body) continue;
            drafts.push({ id: row.ID, anchorName: row.AnchorName, subject, body, email });
        }
        return { drafts, skippedNoEmail: rows.length - drafts.length, approved: rows.length };
    }

    /** A malformed payload must not take the whole run down with it. */
    private parsePayload(raw: string | null): DraftPayload | null {
        if (!raw) return null;
        try {
            const parsed: unknown = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? (parsed as DraftPayload) : null;
        } catch {
            return null;
        }
    }

    /** Move a sent proposal to Executed, which is also what stops a re-run re-sending it. */
    private async markExecuted(proposalId: string, contextUser: UserInfo): Promise<void> {
        const row = await new Metadata().GetEntityObject<mjBizAppsSonarInterventionProposalEntity>(
            PROPOSAL,
            contextUser,
        );
        if (!(await row.Load(proposalId))) return;
        row.Status = "Executed";
        row.ExecutedAt = new Date();
        await row.Save();
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
