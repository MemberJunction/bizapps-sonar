import { Component, OnInit, computed, effect, inject, signal } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";
import { Metadata } from "@memberjunction/core";
import { mjBizAppsSonarScoreModelEntity } from "@mj-biz-apps/sonar-entities";
import { ScoreModelService } from "../../core/services/score-model.service";
import { CurrentModelService } from "../../core/services/current-model.service";
import { SonarDataBusService } from "../../core/services/sonar-data-bus.service";
import { BandKey, OverviewTrend, ScoreReadService } from "../../core/services/score-read.service";
import { aggregateByKey, type BandKeyRow } from "../../core/band-aggregate";
import { bandColor, buildDistributionChart, buildHistoryChart, buildOverviewChart } from "./portfolio-charts";

const MS_PER_DAY = 86_400_000;

/** One model's aggregated data for the portfolio view. */
interface PortfolioSlot {
    model: mjBizAppsSonarScoreModelEntity;
    /** One row per band key in BAND_ORDER, counts summed across bands sharing a key (aggregateByKey). */
    distribution: BandKeyRow[];
    scoredCount: number;
    lastDay: string | null;
    prevDay: string | null;
    staleDays: number | null;
    recovered: number;
    slipped: number;
    net: number;
    trend: OverviewTrend | null;
    loading: boolean;
    /** Set when this model's reads failed. Its counts are then placeholders, never shown as real. */
    error: string | null;
}

function emptySlot(model: mjBizAppsSonarScoreModelEntity): PortfolioSlot {
    return { model, distribution: [], scoredCount: 0, lastDay: null, prevDay: null, staleDays: null, recovered: 0, slipped: 0, net: 0, trend: null, loading: true, error: null };
}

/** 0 = most urgent (slippage), 3 = least (no movement). Used for sort ordering. */
function slotUrgency(s: PortfolioSlot): number {
    if (s.slipped > 0) return 0;
    if (s.distribution.some(d => d.key === "critical" && d.count > 0)) return 1;
    if (s.recovered > 0) return 2;
    return 3;
}

function daysSince(day: string): number {
    const [y, m, d] = day.split("-").map(Number);
    return Math.floor((Date.now() - new Date(y, (m ?? 1) - 1, d ?? 1).getTime()) / MS_PER_DAY);
}

/**
 * Sonar Portfolio — the cross-model command center. Shows the most-urgent model's KPIs, a chart card
 * with three lenses (Overview across all models, plus Distribution and History for the focused
 * model), a movement table, and a compact sidebar list sorted by urgency. Reached via the nav
 * DriverClass 'SonarOverviewResource' (the nav slot it took over from the original Overview).
 *
 * Data loading: distribution + trend for each model are fetched in parallel; a second wave fetches
 * band flows (recovered/slipped counts) for models with ≥ 2 recompute snapshots.
 */
@RegisterClass(BaseResourceComponent, "SonarOverviewResource")
@Component({
    standalone: false,
    selector: "sonar-portfolio-resource",
    templateUrl: "./sonar-portfolio-resource.component.html",
    styleUrls: [
        "../../shared/styles/sonar-shell.css",
        "./sonar-portfolio-resource.component.css",
    ],
})
export class SonarPortfolioResourceComponent extends BaseResourceComponent implements OnInit {
    private readonly modelService = inject(ScoreModelService);
    private readonly scoreRead = inject(ScoreReadService);
    /** Shared cross-surface model selection — set before opening triage so Engagement lands scoped. */
    private readonly current = inject(CurrentModelService);
    private readonly bus = inject(SonarDataBusService);

    public readonly loaded = signal(false);
    /** A manual refresh is in flight (drives the Refresh button's spinner/disabled state). */
    public readonly refreshing = signal(false);
    public readonly slots = signal<PortfolioSlot[]>([]);

    // ── Cross-surface invalidation ─────────────────────────────────────────────
    /** Summed bus revision this surface's contents already reflect; null before the first baseline. */
    private seenRevision: number | null = null;

    /**
     * Re-read when a recompute or config change lands for ANY model on screen. Unlike the single-model
     * surfaces this watches the whole set, so it reads `models` plus every displayed model's topics.
     *
     * Reading `slots()` here is intentional and safe despite `refresh()` writing it: revisions only
     * ever increase, so after a refresh the sum is unchanged and the slot-driven re-run short-circuits
     * on `seen === revision`. That's what stops refresh → slots → effect → refresh from looping.
     */
    private readonly watchInvalidations = effect(() => {
        let revision = this.bus.revision({ topic: "models" });
        for (const slot of this.slots()) {
            revision +=
                this.bus.revision({ topic: "scores", modelId: slot.model.ID }) +
                this.bus.revision({ topic: "config", modelId: slot.model.ID });
        }
        const seen = this.seenRevision;
        this.seenRevision = revision;
        if (seen === null || seen === revision) return;
        void this.refresh();
    });

    /** ID of the sidebar model currently focused — drives Distribution + History lenses. */
    public readonly selectedSlotId = signal<string | null>(null);
    public readonly focusedSlot = computed(() => {
        const id = this.selectedSlotId();
        if (id) return this.slots().find(s => s.model.ID === id) ?? null;
        // Default to the most urgent active scored model so Distribution/History always have content.
        return this.overviewSlots()[0] ?? this.sortedSlots().find(s => s.error === null) ?? null;
    });

    /** The top fold's model: the focused one, unless its reads failed (its zeros are not real). */
    public readonly topFoldSlot = computed(() => {
        const slot = this.focusedSlot();
        return slot && slot.error === null ? slot : null;
    });

    /** The model list itself failed to load — nothing below it is real. */
    public readonly loadError = signal<string | null>(null);

    /** Models whose reads failed, named in the page's alert so a failure never reads as "empty". */
    public readonly failedSlots = computed(() => this.slots().filter(s => s.error !== null));
    public readonly failedNames = computed(() => this.failedSlots().map(s => s.model.Name).join(", "));

    /** Which chart lens is active in the main card. */
    public readonly lensView = signal<"overview" | "distribution" | "history">("overview");

    // ── Chart inputs (@memberjunction/ng-charts; mapping in portfolio-charts.ts) ──
    // Colors are var(--sonar-<band>) references, so the charts re-color through CSS on a theme
    // switch with no re-render.

    /** Overview: horizontal stacked bar — one row per model, bands as segments. */
    public readonly overviewChart = computed(() =>
        buildOverviewChart(this.overviewSlots().map(s => ({ Name: s.model.Name, Distribution: s.distribution })))
    );

    /** Distribution: donut of the focused model's band breakdown, total scored in the center. */
    public readonly distributionChart = computed(() => {
        const slot = this.focusedSlot();
        return buildDistributionChart(slot?.distribution ?? [], slot?.scoredCount ?? 0);
    });

    /** History: 100%-stacked area of the focused model's band mix over recent snapshots. */
    public readonly historyChart = computed(() => {
        const slot = this.focusedSlot();
        return buildHistoryChart(slot?.trend?.points ?? [], slot?.distribution ?? []);
    });

    // ── Derived slices ─────────────────────────────────────────────────────────

    public readonly activeSlots = computed(() =>
        this.slots().filter(s => s.model.Status === "Active")
    );

    /** Overview chart rows: active, scored, sorted most-urgent-first (top row = most urgent). */
    public readonly overviewSlots = computed(() =>
        this.activeSlots()
            .filter(s => s.scoredCount > 0)
            .sort((a, b) => slotUrgency(a) - slotUrgency(b))
    );

    /** Movement table: same set as overviewSlots (active + scored), same sort. */
    public readonly tableSlots = computed(() => this.overviewSlots());

    /** Full list for sidebar: active first, then inactive, each group by urgency. */
    public readonly sortedSlots = computed(() =>
        [...this.slots()].sort((a, b) => {
            const ao = a.model.Status === "Active" ? 0 : 1;
            const bo = b.model.Status === "Active" ? 0 : 1;
            return ao !== bo ? ao - bo : slotUrgency(a) - slotUrgency(b);
        })
    );

    // ── KPI aggregates ─────────────────────────────────────────────────────────

    public readonly kpiActiveCount = computed(() => this.activeSlots().length);

    // NOTE: the top-fold metrics (action bar + primary KPI strip) are scoped to the single
    // most-urgent model via focusedSlot(), NOT summed across models. Summing double-counts members
    // that are scored by more than one model on the same anchor entity (e.g. two lenses over the
    // same 2,000 members would read as ~4,000). Per-model counts are read straight off the slot.

    // ── BaseResourceComponent contract ─────────────────────────────────────────

    public async GetResourceDisplayName(_data: ResourceData): Promise<string> { return "Portfolio"; }
    public async GetResourceIconClass(_data: ResourceData): Promise<string> { return "fa-solid fa-layer-group"; }

    /** Triage action bar CTA → open the Engagement surface, pre-scoped to the focused (most-urgent)
     *  model so the triage list lands on exactly the members the header is calling out. */
    public async navigateToTriage(): Promise<void> {
        const focus = this.focusedSlot();
        if (focus) this.current.select(focus.model.ID);
        const tabId = await this.navigationService.OpenNavItemByName("Engagement");
        if (!tabId) {
            console.warn("Sonar Portfolio: could not open the 'Engagement' nav item for triage.");
        }
    }

    // ── Lifecycle ──────────────────────────────────────────────────────────────

    public ngOnInit(): void {
        void this.loadPortfolio();
    }

    // ── Data loading ───────────────────────────────────────────────────────────

    /**
     * Re-read every model's slot after a Recompute wrote new scores elsewhere. Resource tabs stay
     * mounted, so ngOnInit never fires a second time and the portfolio would otherwise show
     * pre-recompute distributions until a browser reload.
     *
     * Preserves the rendered slots while the new reads land, so a refresh doesn't blank every
     * model to a skeleton and flash every chart.
     */
    public async refresh(): Promise<void> {
        if (this.refreshing()) return;
        this.refreshing.set(true);
        try {
            await this.loadPortfolio(true);
        } finally {
            this.refreshing.set(false);
        }
    }

    /**
     * Load every model's slot. `preserveExisting` keeps the already-rendered slots on screen while
     * the fresh reads land (loadSlot replaces each one in place by model ID) — without it a refresh
     * would blank every slot to its skeleton and flash every chart. Models that have no
     * slot yet are still seeded empty so there's a row for loadSlot to fill.
     */
    private async loadPortfolio(preserveExisting = false): Promise<void> {
        let models: mjBizAppsSonarScoreModelEntity[];
        try {
            models = await this.modelService.list();
            this.loadError.set(null);
        } catch (e) {
            console.error("SonarPortfolio: loading the scoring models failed", e);
            this.loadError.set("Couldn't load the scoring models.");
            this.loaded.set(true);
            return;
        }
        if (preserveExisting) {
            const known = new Set(this.slots().map(s => s.model.ID));
            const added = models.filter(m => !known.has(m.ID)).map(emptySlot);
            // Drop slots for models that no longer exist, keep the rest, append any new ones.
            const live = new Set(models.map(m => m.ID));
            this.slots.update(all => [...all.filter(s => live.has(s.model.ID)), ...added]);
        } else {
            this.slots.set(models.map(emptySlot));
        }
        this.loaded.set(true);
        await Promise.all(models.map(m => this.loadSlot(m).catch((e: unknown) => this.markSlotFailed(m, e))));
    }

    /** A model's reads failed: log it with the model, and mark its slot so no view reports it as empty. */
    private markSlotFailed(model: mjBizAppsSonarScoreModelEntity, e: unknown): void {
        console.error(`SonarPortfolio: loading scores for model "${model.Name}" (${model.ID}) failed`, e);
        this.slots.update(all =>
            // Drop the old counts too: every reader (chart, table, sidebar, sort) then sees placeholders,
            // not numbers from a load that is no longer current.
            all.map(s => s.model.ID === model.ID ? { ...emptySlot(model), loading: false, error: "Couldn't load this model's scores." } : s)
        );
    }

    private async loadSlot(model: mjBizAppsSonarScoreModelEntity): Promise<void> {
        const [dist, trend] = await Promise.all([
            this.scoreRead.distributionForModel(model.ID),
            this.scoreRead.overviewTrendForModel(model.ID),
        ]);

        const lastDay = trend.days.at(-1) ?? null;
        const prevDay = trend.days.length >= 2 ? (trend.days.at(-2) ?? null) : null;
        const scoredCount = dist.total;
        const staleDays = lastDay ? daysSince(lastDay) : null;

        // One row per band key, counts summed: two bands can share a key (5+ band sets, unbanded
        // scores), and every reader below looks a key up once.
        const distribution = aggregateByKey(dist.slices);

        let recovered = 0;
        let slipped = 0;
        if (lastDay && prevDay) {
            const flows = await this.scoreRead.flowsBetween(model.ID, prevDay, lastDay);
            for (const f of flows) {
                if (f.worse) slipped += f.count;
                else recovered += f.count;
            }
        }

        this.slots.update(all =>
            all.map(s =>
                s.model.ID === model.ID
                    ? { model, distribution, scoredCount, lastDay, prevDay, staleDays, recovered, slipped, net: recovered - slipped, trend, loading: false, error: null }
                    : s
            )
        );
    }

    // ── Template helpers ───────────────────────────────────────────────────────

    public pickSlot(id: string): void {
        this.selectedSlotId.set(id);
        this.lensView.set("distribution");
    }

    public setLensView(v: "overview" | "distribution" | "history"): void {
        this.lensView.set(v);
    }

    public bandColor(key: BandKey): string {
        return bandColor(key);
    }

    public anchorName(model: mjBizAppsSonarScoreModelEntity): string {
        return new Metadata().Entities.find(e => e.ID === model.AnchorEntityID)?.Name ?? "—";
    }

    public fmtDay(day: string | null): string {
        if (!day) return "—";
        const [y, m, d] = day.split("-").map(Number);
        return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    public fmtNum(n: number): string {
        return n.toLocaleString();
    }

    public atRiskCount(slot: PortfolioSlot): number {
        const ar = slot.distribution.find(d => d.key === "atrisk")?.count ?? 0;
        const cr = slot.distribution.find(d => d.key === "critical")?.count ?? 0;
        return ar + cr;
    }

    /** At-risk share of one model's scored members (0–100), for the scoped primary KPI sub-line. */
    public atRiskPct(slot: PortfolioSlot): number {
        return slot.scoredCount > 0 ? Math.round((this.atRiskCount(slot) / slot.scoredCount) * 100) : 0;
    }

    /** Left-border color for sidebar rows and table dots — encodes urgency at a glance. */
    public indicatorColor(slot: PortfolioSlot): string {
        if (slot.error) return "var(--sonar-critical)";
        if (slot.model.Status !== "Active") return "var(--sonar-border)";
        if (slot.slipped > 0) return "var(--sonar-atrisk)";
        if (slot.distribution.some(d => d.key === "critical" && d.count > 0)) return "var(--sonar-critical)";
        if (slot.recovered > 0) return "var(--sonar-healthy)";
        return "var(--sonar-border-strong)";
    }

    /** The one number shown on the right of each sidebar row, chosen by urgency priority. */
    public sidebarCount(slot: PortfolioSlot): { value: number; label: string; tone: "warn" | "crit" | "good" | "mute" } | null {
        if (slot.loading || slot.scoredCount === 0) return null;
        if (slot.slipped > 0) return { value: slot.slipped, label: "slipped", tone: "warn" };
        const cr = slot.distribution.find(d => d.key === "critical")?.count ?? 0;
        if (cr > 0) return { value: cr, label: "critical", tone: "crit" };
        if (slot.recovered > 0) return { value: slot.recovered, label: "recovered", tone: "good" };
        const ar = slot.distribution.find(d => d.key === "atrisk")?.count ?? 0;
        if (ar > 0) return { value: ar, label: "at risk", tone: "mute" };
        return null;
    }
}
