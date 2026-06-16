import { Component } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";

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
 * SIMULATED sample data until the recompute/audit PRs land; seams marked `TODO wire:`.
 * "Run now" is inert — recompute runs server-side via the engine and needs an Action.
 */
@RegisterClass(BaseResourceComponent, "SonarAdminOpsResource")
@Component({
    standalone: false,
    selector: "sonar-admin-ops-resource",
    templateUrl: "./sonar-admin-ops-resource.component.html",
    styleUrls: ["../sonar-shell.css", "./sonar-admin-ops-resource.component.css"],
})
export class SonarAdminOpsResourceComponent extends BaseResourceComponent {
    // TODO wire: RunView "MJ_BizApps_Sonar: Score Recompute Runs" OrderBy StartedAt DESC.
    public runs: RunRow[] = [
        { model: "Renewal Risk · v3", trigger: "Scheduled", scope: "Full", scored: 38402, changed: 1204, moves: 17, duration: "2m 41s", cost: "142 u", ok: true, statusLabel: "ok" },
        { model: "Community Engagement · v2", trigger: "Event", scope: "Incremental", scored: 3108, changed: 388, moves: 5, duration: "11s", cost: "9 u", ok: true, statusLabel: "ok" },
        { model: "Learning Engagement · v1", trigger: "Scheduled", scope: "Full", scored: 38402, changed: 902, moves: 12, duration: "3m 58s", cost: "410 u", ok: false, statusLabel: "slow factor" },
        { model: "Donor Propensity · v1", trigger: "Manual", scope: "Full", scored: 12041, changed: 2330, moves: 41, duration: "1m 12s", cost: "88 u", ok: true, statusLabel: "ok" },
    ];

    // TODO wire: RunView "MJ_BizApps_Sonar: Score Model Versions" OrderBy VersionNumber DESC.
    public versions: VersionRow[] = [
        { label: "v3 — renewal-window decay", by: "S. Patel", when: "Jun 9", current: true },
        { label: "v2 — added event attendance", by: "S. Patel", when: "May 2", current: false },
        { label: "v1 — initial rubric", by: "D. Cho", when: "Apr 14", current: false },
    ];

    // TODO wire: RunView "MJ_BizApps_Sonar: Score Model Audit Events" OrderBy ChangedAt DESC.
    public audit: AuditRow[] = [
        { what: "Model Factor", change: "Publish", by: "S. Patel", when: "Jun 9, 10:21" },
        { what: "Factor weight", change: "Update", by: "S. Patel", when: "Jun 9, 10:18" },
        { what: "Score Band", change: "Update", by: "D. Cho", when: "Jun 8, 16:02" },
    ];

    public async GetResourceDisplayName(_data: ResourceData): Promise<string> {
        return "Admin & Ops";
    }
    public async GetResourceIconClass(_data: ResourceData): Promise<string> {
        return "fa-solid fa-gauge-high";
    }

    public override ngOnInit(): void {
        super.ngOnInit();
        this.NotifyLoadComplete();
    }

    // TODO wire: trigger a Manual recompute — needs a server-side engine Action
    // (RecomputeOrchestrator.recompute runs raw SQL server-side). Inert for now.
    public runNow(): void { /* no-op until the engine Action lands */ }
}
