import { Component } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";

type BandKey = "healthy" | "watch" | "atrisk" | "critical";

/** A band summary tile (maps to a COUNT of Scores grouped by BandID). */
interface BandTile { label: string; pct: number; band: BandKey; delta: string; }
/** A member who dropped the most this week (maps to Scores ordered by Delta). */
interface Dropper { initials: string; name: string; renewIn: number; reason: string; score: number; delta: number; band: BandKey; bandLabel: string; }
/** One line of the drill-down "why this score" (maps to Score Factor Contributions). */
interface Contribution { label: string; value: number; }

/**
 * Engagement Manager — the read surface for the people who act on scores: a weekly
 * briefing, band summary tiles, the biggest drops, and a member drill-down with trajectory
 * and factor-level explainability. DriverClass = 'SonarEngagementManagerResource'.
 *
 * SIMULATED sample data until the score/history PRs land; wiring seams marked `TODO wire:`.
 * The action buttons (Export / Launch intervention) are inert — the action/lift layer is
 * Phase 2+ and has no engine or entity support yet.
 */
@RegisterClass(BaseResourceComponent, "SonarEngagementManagerResource")
@Component({
    standalone: false,
    selector: "sonar-engagement-manager-resource",
    templateUrl: "./sonar-engagement-manager-resource.component.html",
    styleUrls: ["../sonar-shell.css", "./sonar-engagement-manager-resource.component.css"],
})
export class SonarEngagementManagerResourceComponent extends BaseResourceComponent {
    public modelName = "Renewal Risk";

    // TODO wire: COUNT of "MJ_BizApps_Sonar: Scores" grouped by BandID, as % of population.
    public tiles: BandTile[] = [
        { label: "Healthy", pct: 61, band: "healthy", delta: "▲ 0.4 pts" },
        { label: "Watch", pct: 22, band: "watch", delta: "▼ 0.2 pts" },
        { label: "At-Risk", pct: 12, band: "atrisk", delta: "▲ 14 new" },
        { label: "Critical", pct: 5, band: "critical", delta: "▲ 3 new" },
    ];

    // TODO wire: RunView "MJ_BizApps_Sonar: Scores" ExtraFilter band in (At-Risk,Critical),
    // OrderBy Delta ASC, joined to the anchor entity for names + RenewalDate.
    public droppers: Dropper[] = [
        { initials: "MC", name: "Maria Chen", renewIn: 47, reason: "cert lapsed · newsletter decay", score: 73, delta: -12, band: "atrisk", bandLabel: "At-Risk" },
        { initials: "JR", name: "James Rivera", renewIn: 22, reason: "no event reg · dues late", score: 58, delta: -19, band: "critical", bandLabel: "Critical" },
        { initials: "PT", name: "Priya Tan", renewIn: 54, reason: "community silence · newsletter decay", score: 69, delta: -9, band: "atrisk", bandLabel: "At-Risk" },
        { initials: "DW", name: "Derek Wu", renewIn: 71, reason: "cert lapsed", score: 66, delta: -8, band: "atrisk", bandLabel: "At-Risk" },
    ];

    /** The member currently shown in the drill-down (defaults to the biggest drop). */
    public selected: Dropper = this.droppers[0];

    // TODO wire: "MJ_BizApps_Sonar: Score Factor Contributions" for the selected score.
    public contributions: Contribution[] = [
        { label: "cert lapsed", value: -22 },
        { label: "newsletter decay", value: -15 },
        { label: "events", value: 8 },
        { label: "dues on time", value: 5 },
    ];

    // TODO wire: "MJ_BizApps_Sonar: Score Histories" for the selected anchor (12mo trend).
    // Sample polyline points (0..300 x, 0..70 y) — a peak then decline, matching the mockup.
    public trajectory = "0,18 30,16 60,15 90,17 120,16 150,20 180,30 210,38 240,46 270,52 300,54";

    public async GetResourceDisplayName(_data: ResourceData): Promise<string> {
        return "Engagement Manager";
    }
    public async GetResourceIconClass(_data: ResourceData): Promise<string> {
        return "fa-solid fa-chart-line";
    }

    public override ngOnInit(): void {
        super.ngOnInit();
        this.NotifyLoadComplete();
    }

    /** Width (%) of a contribution bar, scaled to the largest absolute contribution. */
    public barWidth(value: number): number {
        const max = Math.max(...this.contributions.map((c) => Math.abs(c.value)), 1);
        return Math.round((Math.abs(value) / max) * 100);
    }

    /** Select a member to drill into (visual only; would refetch contributions when wired). */
    public select(d: Dropper): void {
        this.selected = d;
        // TODO wire: refetch this.contributions for d's score.
    }
}
