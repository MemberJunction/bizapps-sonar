import { Component, signal, computed } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";
import { RunView } from "@memberjunction/core";
import { mjBizAppsSonarScoreModelVersionEntity, mjBizAppsSonarScoreRecomputeRunEntity, mjBizAppsSonarScoreModelAuditEventEntity } from "@mj-biz-apps/sonar-entities";

/** A recompute run row (maps to MJ_BizApps_Sonar: Score Recompute Runs). */
interface RunRow {
    model: string; trigger: string; scope: string;
    scored: number; changed: number; moves: number;
    duration: string; cost: string; ok: boolean; statusLabel: string;
}
/** A published version (maps to MJ_BizApps_Sonar: Score Model Versions). `snapshot` is the version's
 *  immutable ConfigSnapshotJSON, pretty-printed; `modelId`/`versionNumber` locate the prior version to
 *  diff against. */
interface VersionRow { label: string; by: string; when: string; current: boolean; modelId: string; versionNumber: number; snapshot: string; }
/** One line of the real config diff between a version and its predecessor. */
interface DiffRow { type: "add" | "del" | "normal"; text: string; }
/** A config-change audit entry (maps to MJ_BizApps_Sonar: Score Model Audit Events). */
interface AuditRow { what: string; change: string; by: string; when: string; }

/**
 * Admin & Ops — the operational surface for v1: recompute-run health and published-version
 * governance (version history + config audit trail), both wired to real data.
 * DriverClass = 'SonarAdminOpsResource'. (Phase 2+ surfaces — write-back, Action promotion,
 * calibration, cost metering — are out of v1 and were removed.)
 */
@RegisterClass(BaseResourceComponent, "SonarAdminOpsResource")
@Component({
    standalone: false,
    selector: "sonar-admin-ops-resource",
    templateUrl: "./sonar-admin-ops-resource.component.html",
    styleUrls: ["../../shared/styles/sonar-shell.css", "./sonar-admin-ops-resource.component.css"],
})
export class SonarAdminOpsResourceComponent extends BaseResourceComponent {
    /** Recompute runs across all models, newest first — wired to real ScoreRecomputeRun rows. */
    public readonly runs = signal<RunRow[]>([]);
    /** Published versions across all models — wired to real ScoreModelVersion rows. */
    public readonly versions = signal<VersionRow[]>([]);
    /** Selected version details for git-style diff preview. */
    public readonly selectedVersion = signal<VersionRow | null>(null);
    /** Config-change audit trail — wired to real ScoreModelAuditEvent rows. */
    public readonly audit = signal<AuditRow[]>([]);

    /** Active operational tab: 'health' | 'governance' */
    public readonly activeTab = signal<'health' | 'governance'>('health');

    public setTab(tab: 'health' | 'governance'): void {
        this.activeTab.set(tab);
    }

    public selectVersion(v: VersionRow): void {
        this.selectedVersion.set(v);
    }

    /** The REAL config diff for the selected version: an LCS line diff of its immutable
     *  ConfigSnapshotJSON against the previous version of the SAME model. Empty for the first version
     *  (nothing to compare) — the template shows an "initial version" note in that case. */
    public readonly diffLines = computed<DiffRow[]>(() => {
        const sel = this.selectedVersion();
        if (!sel) return [];
        const prior = this.versions().find((v) => v.modelId === sel.modelId && v.versionNumber === sel.versionNumber - 1);
        if (!prior) return [];
        return this.computeDiff(prior.snapshot, sel.snapshot);
    });

    /** True when the selected version is a model's first (no prior to diff against). */
    public readonly selectedIsInitial = computed(() => {
        const sel = this.selectedVersion();
        return !!sel && !this.versions().some((v) => v.modelId === sel.modelId && v.versionNumber === sel.versionNumber - 1);
    });

    /** Compute dynamic statistics from runs */
    public readonly successRate = computed(() => {
        const list = this.runs();
        if (!list.length) return "100%";
        const success = list.filter(r => r.ok).length;
        return `${Math.round((success / list.length) * 100)}%`;
    });

    public readonly averageDuration = computed(() => {
        const list = this.runs();
        if (!list.length) return "—";
        let totalSec = 0;
        let count = 0;
        for (const r of list) {
            if (!r.duration || r.duration === "—") continue;
            let sec = 0;
            const mMatch = r.duration.match(/(\d+)m/);
            const sMatch = r.duration.match(/(\d+)s/);
            if (mMatch) sec += parseInt(mMatch[1]) * 60;
            if (sMatch) sec += parseInt(sMatch[1]);
            totalSec += sec;
            count++;
        }
        if (!count) return "—";
        const avg = Math.round(totalSec / count);
        return avg >= 60 ? `${Math.floor(avg / 60)}m ${avg % 60}s` : `${avg}s`;
    });

    public readonly totalScoredCount = computed(() => {
        return this.runs().reduce((acc, r) => acc + r.scored, 0);
    });

    public async GetResourceDisplayName(_data: ResourceData): Promise<string> {
        return "Admin & Ops";
    }
    public async GetResourceIconClass(_data: ResourceData): Promise<string> {
        return "fa-solid fa-gauge-high";
    }

    public override ngOnInit(): void {
        super.ngOnInit();
        void this.loadRuns();
        void this.loadVersions();
        void this.loadAudit();
        this.NotifyLoadComplete();
    }

    /** Recompute runs across all models, most recent first (the view denormalizes the model name). */
    private async loadRuns(): Promise<void> {
        const result = await new RunView().RunView<mjBizAppsSonarScoreRecomputeRunEntity>({
            EntityName: "MJ_BizApps_Sonar: Score Recompute Runs",
            OrderBy: "StartedAt DESC",
            MaxRows: 25,
            ResultType: "entity_object",
        });
        if (!result.Success) return;
        this.runs.set((result.Results ?? []).map((r) => ({
            model: r.ScoreModel ?? "Model",
            trigger: r.TriggerType ?? "—",
            scope: r.Scope ?? "—",
            scored: r.RecordsScored ?? 0,
            changed: r.RecordsChanged ?? 0,
            moves: r.BandTransitions ?? 0,
            duration: this.formatDuration(r.DurationMs),
            cost: r.CostUnitsConsumed != null ? `${r.CostUnitsConsumed} u` : "—",
            ok: r.Status === "Succeeded",
            statusLabel: r.Status === "Succeeded" ? "ok" : (r.Status ?? "—").toLowerCase(),
        })));
    }

    /** Config-change audit entries, most recent first (the view denormalizes the changed-by user). */
    private async loadAudit(): Promise<void> {
        const result = await new RunView().RunView<mjBizAppsSonarScoreModelAuditEventEntity>({
            EntityName: "MJ_BizApps_Sonar: Score Model Audit Events",
            OrderBy: "ChangedAt DESC",
            MaxRows: 25,
            ResultType: "entity_object",
        });
        if (!result.Success) return;
        this.audit.set((result.Results ?? []).map((a) => ({
            what: a.EntityChanged ?? "—",
            change: a.ChangeType ?? "—",
            by: a.ChangedByUser ?? "—",
            when: this.formatWhen(a.ChangedAt),
        })));
    }

    /** Human duration from a millisecond count ("2m 41s" / "11s" / "—"). Negative/absent → "—"
     *  (a negative duration means a clock-skewed StartedAt/CompletedAt, not a real elapsed time). */
    private formatDuration(ms: number | null): string {
        if (ms == null || ms < 0) return "—";
        const s = Math.round(ms / 1000);
        return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
    }

    /** Load every published version across models, newest first (the denormalized view carries
     *  the model name + publisher, so no extra lookups). */
    private async loadVersions(): Promise<void> {
        const result = await new RunView().RunView<mjBizAppsSonarScoreModelVersionEntity>({
            EntityName: "MJ_BizApps_Sonar: Score Model Versions",
            OrderBy: "PublishedAt DESC",
            ResultType: "entity_object",
        });
        if (!result.Success) return;
        const rows: VersionRow[] = (result.Results ?? []).map((v) => ({
            label: `${v.ScoreModel ?? "Model"} · v${v.VersionNumber}${v.VersionLabel ? ` — ${v.VersionLabel}` : ""}`,
            by: v.PublishedByUser ?? "—",
            when: this.formatWhen(v.PublishedAt),
            current: v.IsCurrent ?? false,
            modelId: v.ScoreModelID,
            versionNumber: v.VersionNumber,
            snapshot: this.prettySnapshot(v.ConfigSnapshotJSON),
        }));
        this.versions.set(rows);
        if (rows.length > 0) {
            this.selectedVersion.set(rows[0]);
        }
    }

    /** Pretty-print a version's immutable ConfigSnapshotJSON for the diff view (empty string when
     *  absent/unparseable, so the diff just shows nothing rather than throwing). */
    private prettySnapshot(json: string | null): string {
        if (!json) return "";
        try {
            return JSON.stringify(JSON.parse(json), null, 2);
        } catch {
            return json; // already a string; show as-is rather than lose it
        }
    }

    /**
     * Unified line diff (LCS) between two config snapshots — added/removed/context rows. Inputs are a
     * model's snapshot JSON (small), so the O(n·m) table is fine. Same algorithm as the Signal Studio's
     * code diff; kept local to avoid a shared-util dependency for one screen.
     */
    private computeDiff(oldText: string, newText: string): DiffRow[] {
        const a = oldText.split("\n");
        const b = newText.split("\n");
        const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
        for (let i = a.length - 1; i >= 0; i--) {
            for (let j = b.length - 1; j >= 0; j--) {
                lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
            }
        }
        const rows: DiffRow[] = [];
        let i = 0, j = 0;
        while (i < a.length && j < b.length) {
            if (a[i] === b[j]) { rows.push({ type: "normal", text: a[i] }); i++; j++; }
            else if (lcs[i + 1][j] >= lcs[i][j + 1]) { rows.push({ type: "del", text: a[i] }); i++; }
            else { rows.push({ type: "add", text: b[j] }); j++; }
        }
        while (i < a.length) rows.push({ type: "del", text: a[i++] });
        while (j < b.length) rows.push({ type: "add", text: b[j++] });
        return rows;
    }

    /** Short "Mon D" label for a publish date (em dash when absent). */
    private formatWhen(date: Date | null): string {
        return date ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—";
    }
}
