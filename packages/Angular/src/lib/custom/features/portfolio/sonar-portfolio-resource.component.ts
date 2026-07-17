import { Component, OnDestroy, OnInit, computed, inject, signal } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";
import { Metadata } from "@memberjunction/core";
import { mjBizAppsSonarScoreModelEntity } from "@mj-biz-apps/sonar-entities";
import { ScoreModelService } from "../../core/services/score-model.service";
import { CurrentModelService } from "../../core/services/current-model.service";
import { BandKey, BandSlice, OverviewTrend, ScoreReadService } from "../../core/services/score-read.service";
import type {
    ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels,
    ApexStroke, ApexFill, ApexLegend, ApexTooltip, ApexPlotOptions,
    ApexNonAxisChartSeries, ApexGrid,
} from "ng-apexcharts";

const BAND_ORDER: BandKey[] = ["healthy", "watch", "atrisk", "critical"];
const MS_PER_DAY = 86_400_000;

const BAND_COLORS: Record<BandKey, string> = {
    healthy:  "#10b981",
    watch:    "#3b82f6",
    atrisk:   "#f97316",
    critical: "#ef4444",
};

const BAND_LABELS: Record<BandKey, string> = {
    healthy:  "Healthy",
    watch:    "Watch",
    atrisk:   "At Risk",
    critical: "Critical",
};

/** One model's aggregated data for the portfolio view. */
interface PortfolioSlot {
    model: mjBizAppsSonarScoreModelEntity;
    /** Distribution in BAND_ORDER so the Marimekko stacks consistently. */
    distribution: BandSlice[];
    scoredCount: number;
    lastDay: string | null;
    prevDay: string | null;
    staleDays: number | null;
    recovered: number;
    slipped: number;
    net: number;
    trend: OverviewTrend | null;
    loading: boolean;
}

/** One row in the per-model insight (distribution) table. */
interface InsightRow { key: BandKey; label: string; count: number; pct: number; delta: number | null; }
/** One column in the band-mix history chart. */
interface MixCol { label: string; segments: { key: BandKey; pct: number }[]; }

function emptySlot(model: mjBizAppsSonarScoreModelEntity): PortfolioSlot {
    return { model, distribution: [], scoredCount: 0, lastDay: null, prevDay: null, staleDays: null, recovered: 0, slipped: 0, net: 0, trend: null, loading: true };
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
 * Sonar Portfolio — the cross-model command center. Shows all active scoring models simultaneously
 * via a proportional band distribution chart (Marimekko), aggregate KPIs, a movement table, and
 * a compact sidebar list sorted by urgency. Reached via the nav DriverClass 'SonarPortfolioResource'.
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
export class SonarPortfolioResourceComponent extends BaseResourceComponent implements OnInit, OnDestroy {
    private readonly modelService = inject(ScoreModelService);
    private readonly scoreRead = inject(ScoreReadService);
    /** Shared cross-surface model selection — set before opening triage so Engagement lands scoped. */
    private readonly current = inject(CurrentModelService);

    /** Tracks the MJ dark-mode flag so charts re-render with correct colors on theme switch. */
    private readonly darkMode = signal(
        document.documentElement.getAttribute("data-theme") === "dark"
    );
    private themeObserver: MutationObserver | null = null;

    public readonly loaded = signal(false);
    public readonly slots = signal<PortfolioSlot[]>([]);

    /** Which Marimekko mode is active: proportional (width = member count) or normalized (equal widths). */
    public readonly chartView = signal<"proportional" | "normalized">("proportional");

    /** ID of the Marimekko column currently under the mouse — drives the hover info panel. */
    public readonly hoveredSlotId = signal<string | null>(null);
    public readonly hoveredSlot = computed(() => {
        const id = this.hoveredSlotId();
        return id ? (this.mekSlots().find(s => s.model.ID === id) ?? null) : null;
    });

    /** ID of the sidebar model currently focused — drives Distribution + History lenses. */
    public readonly selectedSlotId = signal<string | null>(null);
    public readonly focusedSlot = computed(() => {
        const id = this.selectedSlotId();
        if (id) return this.slots().find(s => s.model.ID === id) ?? null;
        // Default to the most urgent active scored model so Distribution/History always have content.
        return this.mekSlots()[0] ?? this.sortedSlots()[0] ?? null;
    });

    /** Which chart lens is active in the main card. */
    public readonly lensView = signal<"marimekko" | "distribution" | "history">("marimekko");

    // ── ApexCharts configurations ──────────────────────────────────────────────

    private baseChart(dark: boolean, extra: Partial<ApexChart>): ApexChart {
        return {
            toolbar: { show: false },
            fontFamily: "inherit",
            animations: { enabled: true, speed: 500, animateGradually: { enabled: false } },
            background: "transparent",
            foreColor: dark ? "#9ca3af" : "#6b7280",
            ...extra,
        } as ApexChart;
    }

    private baseGrid(dark: boolean): ApexGrid {
        return {
            borderColor: dark ? "#334155" : "#e5e7eb",
            strokeDashArray: 3,
            padding: { left: 4, right: 4 },
        };
    }

    /** Overview: horizontal stacked bar — one row per model, bands as segments. */
    public readonly overviewChart = computed(() => {
        const slots = this.mekSlots();
        const dark = this.darkMode();
        return {
            series: BAND_ORDER.map(key => ({
                name: BAND_LABELS[key],
                data: slots.map(s => s.distribution.find(d => d.key === key)?.count ?? 0),
            })) as ApexAxisChartSeries,
            chart: this.baseChart(dark, { type: "bar", stacked: true, height: Math.max(180, slots.length * 52 + 60) }),
            plotOptions: { bar: { horizontal: true, barHeight: "55%", borderRadius: 4, borderRadiusApplication: "end" as const } } as ApexPlotOptions,
            xaxis: { categories: slots.map(s => s.model.Name), labels: { formatter: (v: string) => Number(v).toLocaleString(), style: { colors: dark ? "#9ca3af" : "#6b7280" } } } as ApexXAxis,
            colors: BAND_ORDER.map(k => BAND_COLORS[k]),
            dataLabels: { enabled: false } as ApexDataLabels,
            legend: { position: "bottom", horizontalAlign: "center", fontSize: "12px", itemMargin: { horizontal: 8 }, labels: { colors: dark ? "#9ca3af" : "#374151" } } as ApexLegend,
            grid: this.baseGrid(dark),
            tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v: number) => v.toLocaleString() } } as ApexTooltip,
            fill: { opacity: 1 } as ApexFill,
        };
    });

    /** Distribution: donut chart for the focused model's band breakdown. */
    public readonly distributionChart = computed(() => {
        const slot = this.focusedSlot();
        const dark = this.darkMode();
        const counts = BAND_ORDER.map(k => slot?.distribution.find(d => d.key === k)?.count ?? 0);
        const total = slot?.scoredCount ?? 0;
        const labelColor = dark ? "#9ca3af" : "#6b7280";
        const valueColor = dark ? "#f1f5f9" : "#111827";
        return {
            series: counts as ApexNonAxisChartSeries,
            chart: this.baseChart(dark, { type: "donut", height: 300 }),
            labels: BAND_ORDER.map(k => BAND_LABELS[k]),
            colors: BAND_ORDER.map(k => BAND_COLORS[k]),
            plotOptions: {
                pie: {
                    donut: {
                        size: "70%",
                        labels: {
                            show: true,
                            total: { show: true, label: "Scored", fontSize: "13px", fontWeight: 600, color: labelColor, formatter: () => total.toLocaleString() },
                            value: { fontSize: "22px", fontWeight: 800, color: valueColor, formatter: (v: string) => Number(v).toLocaleString() },
                        },
                    },
                },
            } as ApexPlotOptions,
            dataLabels: { enabled: true, formatter: (v: number) => Math.round(v) + "%" } as ApexDataLabels,
            legend: { position: "bottom", horizontalAlign: "center", fontSize: "12px", itemMargin: { horizontal: 8 }, labels: { colors: dark ? "#9ca3af" : "#374151" } } as ApexLegend,
            stroke: { width: 2, colors: ["transparent"] } as ApexStroke,
            tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v: number) => v.toLocaleString() } } as ApexTooltip,
        };
    });

    /** History: 100% stacked area — smooth band-mix evolution over time. */
    public readonly historyChart = computed(() => {
        const slot = this.focusedSlot();
        const dark = this.darkMode();
        const cols = slot ? this.mixCols(slot) : [];
        return {
            series: BAND_ORDER.map(key => ({
                name: BAND_LABELS[key],
                data: cols.map(c => {
                    const seg = c.segments.find(s => s.key === key);
                    return seg ? Math.round(seg.pct) : 0;
                }),
            })) as ApexAxisChartSeries,
            chart: this.baseChart(dark, { type: "area", stacked: true, stackType: "100%" as const, height: 300 }),
            xaxis: { categories: cols.map(c => c.label), labels: { style: { fontSize: "11px", colors: dark ? "#9ca3af" : "#6b7280" } } } as ApexXAxis,
            colors: BAND_ORDER.map(k => BAND_COLORS[k]),
            stroke: { curve: "smooth", width: 2 } as ApexStroke,
            fill: { type: "solid", opacity: dark ? 0.75 : 0.85 } as ApexFill,
            dataLabels: { enabled: false } as ApexDataLabels,
            legend: { position: "bottom", horizontalAlign: "center", fontSize: "12px", itemMargin: { horizontal: 8 }, labels: { colors: dark ? "#9ca3af" : "#374151" } } as ApexLegend,
            grid: this.baseGrid(dark),
            tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v: number) => v + "%" } } as ApexTooltip,
        };
    });

    // ── Derived slices ─────────────────────────────────────────────────────────

    public readonly activeSlots = computed(() =>
        this.slots().filter(s => s.model.Status === "Active")
    );

    /** Marimekko: active, scored, sorted most-urgent-first (drives column order left→right). */
    public readonly mekSlots = computed(() =>
        this.activeSlots()
            .filter(s => s.scoredCount > 0)
            .sort((a, b) => slotUrgency(a) - slotUrgency(b))
    );

    /** Movement table: same set as mekSlots (active + scored), same sort. */
    public readonly tableSlots = computed(() => this.mekSlots());

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

    public readonly kpiTotalScored = computed(() =>
        this.activeSlots().reduce((n, s) => n + s.scoredCount, 0)
    );

    public readonly kpiAtRisk = computed(() =>
        this.activeSlots().reduce((n, s) => n + this.atRiskCount(s), 0)
    );

    public readonly kpiAtRiskPct = computed(() => {
        const scored = this.kpiTotalScored();
        return scored > 0 ? Math.round((this.kpiAtRisk() / scored) * 100) : 0;
    });

    public readonly kpiNet = computed(() =>
        this.activeSlots().reduce((n, s) => n + s.net, 0)
    );

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
        this.themeObserver = new MutationObserver(() => {
            this.darkMode.set(document.documentElement.getAttribute("data-theme") === "dark");
        });
        this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }

    public ngOnDestroy(): void {
        this.themeObserver?.disconnect();
    }

    // ── Data loading ───────────────────────────────────────────────────────────

    private async loadPortfolio(): Promise<void> {
        const models = await this.modelService.list();
        this.slots.set(models.map(emptySlot));
        this.loaded.set(true);
        await Promise.all(models.map(m => this.loadSlot(m)));
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

        // Pin to BAND_ORDER so the Marimekko column-reverse stack is deterministic.
        const distribution: BandSlice[] = BAND_ORDER.map(k =>
            dist.slices.find(s => s.key === k) ?? { key: k, label: k, count: 0, pct: 0, bandId: null }
        );

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
                    ? { model, distribution, scoredCount, lastDay, prevDay, staleDays, recovered, slipped, net: recovered - slipped, trend, loading: false }
                    : s
            )
        );
    }

    // ── Template helpers ───────────────────────────────────────────────────────

    public setChartView(v: "proportional" | "normalized"): void {
        this.chartView.set(v);
    }

    public pickSlot(id: string): void {
        this.selectedSlotId.set(id);
        this.lensView.set("distribution");
    }

    public setLensView(v: "marimekko" | "distribution" | "history"): void {
        this.lensView.set(v);
    }

    /** Rows for the per-model insight table — BAND_ORDER, annotated with delta vs prev snapshot. */
    public insightRows(slot: PortfolioSlot): InsightRow[] {
        const prev = slot.trend && slot.trend.points.length >= 2 ? slot.trend.points.at(-2) ?? null : null;
        return BAND_ORDER.map(key => {
            const band = slot.distribution.find(b => b.key === key);
            const count = band?.count ?? 0;
            const pct = band?.pct ?? 0;
            const prevCount = prev ? (prev.counts[key] ?? 0) : null;
            const delta = prevCount !== null ? count - prevCount : null;
            return { key, label: band?.label ?? key, count, pct, delta };
        }).filter(r => r.count > 0);
    }

    /** Columns for the band-mix history chart — last 8 trend snapshots, each proportionally stacked. */
    public mixCols(slot: PortfolioSlot): MixCol[] {
        const pts = slot.trend?.points.slice(-8) ?? [];
        return pts.map(pt => {
            const total = pt.total || 1;
            const asOfDate = pt.asOf instanceof Date ? pt.asOf : new Date(pt.asOf);
            const label = asOfDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const segments = BAND_ORDER
                .map(key => ({ key, pct: ((pt.counts[key] ?? 0) / total) * 100 }))
                .filter(s => s.pct > 0);
            return { label, segments };
        });
    }

    public deltaGood(row: InsightRow): boolean {
        if (row.delta === null || row.delta === 0) return false;
        return row.key === "healthy" ? row.delta > 0 : row.delta < 0;
    }

    public deltaBad(row: InsightRow): boolean {
        if (row.delta === null || row.delta === 0) return false;
        return row.key === "healthy" ? row.delta < 0 : row.delta > 0;
    }

    /** Flex value for a Marimekko column: member count in proportional mode, 1 in normalized. */
    public mekFlex(slot: PortfolioSlot): number {
        return this.chartView() === "proportional" ? slot.scoredCount : 1;
    }

    public bandColor(key: BandKey | string): string {
        return `var(--sonar-${key})`;
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
