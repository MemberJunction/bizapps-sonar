import { Component, signal } from "@angular/core";
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
/** A published version (maps to MJ_BizApps_Sonar: Score Model Versions). */
interface VersionRow { label: string; by: string; when: string; current: boolean; }
/** A config-change audit entry (maps to MJ_BizApps_Sonar: Score Model Audit Events). */
interface AuditRow { what: string; change: string; by: string; when: string; }

/**
 * Admin & Ops — the operational surface: recompute-run health, published version history,
 * and the config audit trail; plus Phase 2+ placeholders for write-back, Action promotion,
 * and the calibration network. DriverClass = 'SonarAdminOpsResource'.
 *
 * Run health, versions, and the audit trail are wired to real data. "Run now" is inert —
 * recompute runs server-side via the engine Action and is triggered from the Model Builder.
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
    /** Config-change audit trail — wired to real ScoreModelAuditEvent rows. */
    public readonly audit = signal<AuditRow[]>([]);

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
        this.versions.set((result.Results ?? []).map((v) => ({
            label: `${v.ScoreModel ?? "Model"} · v${v.VersionNumber}${v.VersionLabel ? ` — ${v.VersionLabel}` : ""}`,
            by: v.PublishedByUser ?? "—",
            when: this.formatWhen(v.PublishedAt),
            current: v.IsCurrent ?? false,
        })));
    }

    /** Short "Mon D" label for a publish date (em dash when absent). */
    private formatWhen(date: Date | null): string {
        return date ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—";
    }

    // TODO wire: trigger a Manual recompute — needs a server-side engine Action
    // (RecomputeOrchestrator.recompute runs raw SQL server-side). Inert for now.
    public runNow(): void { /* no-op until the engine Action lands */ }
}
