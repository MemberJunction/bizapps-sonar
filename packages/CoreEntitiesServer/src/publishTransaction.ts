import { RunInEntityTransaction } from "@memberjunction/core";

/** The provider shape RunInEntityTransaction arbitrates over (a BaseEntity's ProviderToUse satisfies it). */
export type PublishTransactionProvider = Parameters<typeof RunInEntityTransaction>[0];

/** A record the publish writes — a ScoreModelVersion entity satisfies it. */
export interface PublishWriteRecord {
    Save(): Promise<boolean>;
    LatestResult?: { CompleteMessage?: string } | null;
}

/** The three writes a publish makes, in order. `saveModel` points the model at the new version and
 *  saves it (the caller owns that closure because it calls the entity's own base `Save`). */
export interface PublishWrites {
    /** The version being superseded, already flagged `IsCurrent = false`; null on a first publish. */
    priorVersion: PublishWriteRecord | null;
    /** The new immutable snapshot, flagged `IsCurrent = true`. */
    newVersion: PublishWriteRecord;
    /** Point the model at the new version and save it. */
    saveModel: () => Promise<{ ok: boolean; message?: string }>;
}

/** String discriminant on purpose: the server tsconfig is non-strict, where a `true | false`
 *  discriminant does not narrow the failure branch. */
export type PublishOutcome = { status: "committed" } | { status: "rolledBack"; error: string };

/**
 * Commit a publish — demote the prior version, insert the new one, repoint the model — as ONE unit
 * inside the CALLER's transaction.
 *
 * It used to run through its own TransactionGroup, which commits independently of any transaction
 * already in flight on the provider. A `mj sync push` (one host transaction for the whole push) that
 * failed AFTER an activation therefore rolled back everything except the publish: the model was left
 * Active, pointing at a version whose configuration had just been rolled back. RunInEntityTransaction
 * joins an in-flight transaction as a savepoint (or opens one when there is none), so a failing outer
 * unit of work now takes the publish down with it, and a failing publish rolls back only itself.
 *
 * Every step is checked: an entity Save() that returns false is turned into a throw so the scope
 * rolls back instead of committing a half-published state.
 */
export async function commitPublish(provider: PublishTransactionProvider, writes: PublishWrites): Promise<PublishOutcome> {
    try {
        await RunInEntityTransaction(provider, async () => {
            if (writes.priorVersion) {
                await requireSaved(writes.priorVersion, "demote the current version");
            }
            await requireSaved(writes.newVersion, "insert the new version");
            const model = await writes.saveModel();
            if (!model.ok) {
                throw new Error(`Could not save the model: ${model.message ?? "unknown error"}`);
            }
        });
        return { status: "committed" };
    } catch (e: unknown) {
        return { status: "rolledBack", error: e instanceof Error ? e.message : String(e) };
    }
}

/** Save one record or throw (so the surrounding scope rolls back). */
async function requireSaved(record: PublishWriteRecord, step: string): Promise<void> {
    if (!(await record.Save())) {
        throw new Error(`Could not ${step}: ${record.LatestResult?.CompleteMessage ?? "unknown error"}`);
    }
}
