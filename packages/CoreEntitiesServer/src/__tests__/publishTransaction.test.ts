import { describe, expect, it } from "vitest";
import type { EntityTransactionScope } from "@memberjunction/core";
import { commitPublish, PublishWriteRecord, PublishWrites } from "../publishTransaction";

/**
 * The publish must join the CALLER's transaction instead of committing on its own. These drive the
 * real RunInEntityTransaction against a fake provider that records scope traffic, the way the SQL
 * Server provider would: an in-flight outer scope makes the publish a nested scope (a savepoint), so
 * when the outer unit fails afterwards nothing of the publish survives.
 */
class FakeProvider {
    public readonly SupportsEntityTransactions = true;
    public readonly log: string[] = [];
    /** Writes visible to the "database": a write lands in the open scope and only survives its commit. */
    public readonly committed: string[] = [];
    private readonly open: string[][] = [];

    public async BeginEntityTransaction(): Promise<EntityTransactionScope> {
        const depth = this.open.length;
        this.open.push([]);
        this.log.push(depth === 0 ? "begin" : `savepoint@${depth}`);
        let settled = false;
        const settle = (commit: boolean): void => {
            if (settled) return;
            settled = true;
            const writes = this.open.pop() ?? [];
            this.log.push(`${commit ? "commit" : "rollback"}@${depth}`);
            if (!commit) return;
            const parent = this.open[this.open.length - 1];
            (parent ?? this.committed).push(...writes);
        };
        return {
            IsNested: depth > 0,
            Commit: async () => settle(true),
            Rollback: async () => settle(false),
        };
    }

    public write(name: string): void {
        (this.open[this.open.length - 1] ?? this.committed).push(name);
    }
}

function record(provider: FakeProvider, name: string, ok = true): PublishWriteRecord & { saved: number } {
    const r = {
        saved: 0,
        LatestResult: ok ? null : { CompleteMessage: `${name} refused` },
        async Save(): Promise<boolean> {
            r.saved++;
            if (ok) provider.write(name);
            return ok;
        },
    };
    return r;
}

function writes(provider: FakeProvider, opts: { prior?: boolean; versionOk?: boolean; modelOk?: boolean } = {}): PublishWrites {
    return {
        priorVersion: opts.prior === false ? null : record(provider, "demote-v1"),
        newVersion: record(provider, "insert-v2", opts.versionOk ?? true),
        saveModel: async () => {
            const ok = opts.modelOk ?? true;
            if (ok) provider.write("model->v2");
            return { ok, message: ok ? undefined : "model refused" };
        },
    };
}

describe("commitPublish", () => {
    it("commits the demote, insert and repoint together, in order", async () => {
        const p = new FakeProvider();
        expect(await commitPublish(p, writes(p))).toEqual({ status: "committed" });
        expect(p.committed).toEqual(["demote-v1", "insert-v2", "model->v2"]);
        expect(p.log).toEqual(["begin", "commit@0"]);
    });

    it("handles a first publish with no prior version", async () => {
        const p = new FakeProvider();
        expect(await commitPublish(p, writes(p, { prior: false }))).toEqual({ status: "committed" });
        expect(p.committed).toEqual(["insert-v2", "model->v2"]);
    });

    it("rolls everything back when the model save fails — no orphan version", async () => {
        const p = new FakeProvider();
        const outcome = await commitPublish(p, writes(p, { modelOk: false }));
        expect(outcome).toEqual({ status: "rolledBack", error: "Could not save the model: model refused" });
        expect(p.committed).toEqual([]);
        expect(p.log).toEqual(["begin", "rollback@0"]);
    });

    it("stops at a failed version insert and never repoints the model", async () => {
        const p = new FakeProvider();
        const w = writes(p, { versionOk: false });
        let modelSaved = false;
        const inner = w.saveModel;
        w.saveModel = async () => {
            modelSaved = true;
            return inner();
        };
        const outcome = await commitPublish(p, w);
        expect(outcome.status).toBe("rolledBack");
        expect(modelSaved).toBe(false);
        expect(p.committed).toEqual([]);
    });

    it("joins an in-flight caller transaction, so the caller's later failure takes the publish with it", async () => {
        const p = new FakeProvider();
        const outer = await p.BeginEntityTransaction(); // e.g. the mj sync push host transaction
        p.write("factor-edits");
        expect(await commitPublish(p, writes(p))).toEqual({ status: "committed" });
        expect(p.committed).toEqual([]); // nothing escaped the outer scope
        await outer.Rollback(); // a later record in the push fails
        expect(p.committed).toEqual([]);
        expect(p.log).toEqual(["begin", "savepoint@1", "commit@1", "rollback@0"]);
    });

    it("on its own failure rolls back only its savepoint, leaving the caller's work intact", async () => {
        const p = new FakeProvider();
        const outer = await p.BeginEntityTransaction();
        p.write("factor-edits");
        expect((await commitPublish(p, writes(p, { modelOk: false }))).status).toBe("rolledBack");
        await outer.Commit();
        expect(p.committed).toEqual(["factor-edits"]);
    });
});
