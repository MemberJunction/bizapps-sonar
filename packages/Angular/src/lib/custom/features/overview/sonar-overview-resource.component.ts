import { Component, computed, effect, inject, signal, untracked } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";
import { Metadata, RunView } from "@memberjunction/core";
import { mjBizAppsSonarScoreModelEntity } from "@mj-biz-apps/sonar-entities";
import { ScoreModelService } from "../../core/services/score-model.service";
import { FactorService } from "../../core/services/factor.service";
import { ScoreBandService } from "../../core/services/score-band.service";
import { BandFlow, BandKey, BandSlice, BandTrendPoint, OverviewTrend, ScoreReadService, WindowMover } from "../../core/services/score-read.service";
import { CurrentModelService } from "../../core/services/current-model.service";

/** The hero's three lenses on the same population. Persisted so a user's preferred default sticks. */
export type HeroView = "insight" | "flow" | "mix";
const HERO_VIEW_KEY = "sonar.overviewHeroView";

/** The action card's look-back window: since the previous recompute, or a days-based window
 *  resolved against history snapshots (so it works regardless of the stored Score.Delta). */
export type ActionWindow = "run" | 30 | 90 | 365;
const MS_PER_DAY = 86_400_000;

/** Band-key severity order, healthy end first — drives row order and worse/better judgments. */
const BAND_ORDER: BandKey[] = ["healthy", "watch", "atrisk", "critical"];

/** One row of the insight table: a band's current share, prev → curr counts, and its share
 *  sparkline. All sparklines share ONE y-scale so a 0.3% wiggle can't masquerade as a collapse. */
interface InsightRow {
    key: BandKey;
    label: string;
    count: number;
    pct: number;
    prev: number | null;
    delta: number | null;
    /** Whether the count change is a good or bad sign for THIS band (growth in At Risk is bad,
     *  growth in Healthy is good, middle bands stay neutral). */
    tone: "worse" | "better" | "flat";
    spark: { line: string; area: string; endX: number; endY: number } | null;
}

/** One side of the migration diagram: a band node with its member count at that date. */
interface FlowNode { key: BandKey; label: string; count: number; }
/** A ribbon between two band nodes (real movement between the last two recomputes). */
interface FlowLink { d: string; width: number; worse: boolean; count: number; labelX: number; labelY: number; }

/** One column of the band-mix chart: a recompute date with its per-band share segments. */
interface MixColumn { dateLabel: string; segments: { key: BandKey; pct: number }[]; }

/** The hero's plain-language headline, in one of three shapes. */
interface Headline {
    kind: "first" | "steady" | "moved";
    declined: number;
    improved: number;
    movedPct: number;
    worstLabel: string;
    topFlow: BandFlow | null;
    prevDate: string;
    currDate: string;
}

/**
 * Sonar Overview — the at-a-glance dashboard for the CURRENT model (scores are per-model, so
 * the overview is strongest scoped to one). The shared model rail picks the model; this surface
 * leads with a plain-language "what changed" headline over a switchable visualization (insight
 * table / migration flow / band mix), then a full-width "who needs action" card. Reached via the
 * nav item whose DriverClass = 'SonarOverviewResource'.
 */
@RegisterClass(BaseResourceComponent, "SonarOverviewResource")
@Component({
    standalone: false,
    selector: "sonar-overview-resource",
    templateUrl: "./sonar-overview-resource.component.html",
    styleUrls: ["../../shared/styles/sonar-shell.css", "./sonar-overview-resource.component.css"],
})
export class SonarOverviewResourceComponent extends BaseResourceComponent {
    private readonly modelService = inject(ScoreModelService);
    private readonly factorService = inject(FactorService);
    private readonly bandService = inject(ScoreBandService);
    private readonly scoreRead = inject(ScoreReadService);
    public readonly current = inject(CurrentModelService);

    public readonly loaded = signal(false);
    /** True while a model's context is loading — drives the hero/stat skeletons. */
    public readonly loadingModel = signal(false);
    /** The selected model (entity) + its derived context. */
    public readonly model = signal<mjBizAppsSonarScoreModelEntity | null>(null);
    public readonly anchorName = signal("—");
    public readonly population = signal<number | null>(null);
    public readonly signalCount = signal(0);
    public readonly bandCount = signal(0);
    public readonly scoredCount = signal(0);
    public readonly distribution = signal<BandSlice[]>([]);
    /** Server-aggregated band mix per snapshot day (SQL does the heavy lifting — the browser
     *  never sees raw history rows). `days` are the valid baselines for the windowed queries. */
    public readonly history = signal<OverviewTrend | null>(null);
    public readonly trend = computed<BandTrendPoint[]>(() => this.history()?.points ?? []);
    /** The hero's flows: band changes between the last two recomputes (fixed lens — the
     *  action card below has its own adjustable window). Loaded alongside the trend. */
    public readonly flows = signal<BandFlow[]>([]);

    /** Which hero lens is showing. Hydrated from localStorage so the preference sticks. */
    public readonly heroView = signal<HeroView>(this.readHeroViewPreference());

    public setHeroView(view: HeroView): void {
        this.heroView.set(view);
        try { localStorage.setItem(HERO_VIEW_KEY, view); } catch { /* private browsing — in-memory only */ }
    }

    private readHeroViewPreference(): HeroView {
        try {
            const stored = localStorage.getItem(HERO_VIEW_KEY);
            if (stored === "insight" || stored === "flow" || stored === "mix") return stored;
        } catch { /* localStorage unavailable — fall through to default */ }
        return "insight";
    }

    // ── Action card: adjustable look-back window ────────────────────────────────

    /** Picker options for the action card's timeframe. */
    public readonly windowOptions: { id: ActionWindow; label: string }[] = [
        { id: "run", label: "Last recompute" },
        { id: 30, label: "30d" },
        { id: 90, label: "90d" },
        { id: 365, label: "1y" },
    ];
    public readonly actionWindow = signal<ActionWindow>("run");

    /** The snapshot day the action card compares against. Days-based windows resolve to the
     *  latest snapshot at/before (newest − N days); asking further back than history exists
     *  clamps to the oldest snapshot (flagged so the UI can say so instead of pretending). */
    public readonly actionBaseline = computed<{ day: string; clamped: boolean } | null>(() => {
        const h = this.history();
        if (!h || h.days.length < 2) return null;
        const w = this.actionWindow();
        if (w === "run") return { day: h.days[h.days.length - 2], clamped: false };
        const newest = this.parseDay(h.days[h.days.length - 1]).getTime();
        const cutoff = newest - w * MS_PER_DAY;
        const eligible = h.days.slice(0, -1).filter((d: string) => this.parseDay(d).getTime() <= cutoff);
        if (eligible.length > 0) return { day: eligible[eligible.length - 1], clamped: false };
        return { day: h.days[0], clamped: true };
    });

    /** Display date of the baseline snapshot (e.g. "May 22"). */
    public readonly actionBaselineLabel = computed<string | null>(() => {
        const b = this.actionBaseline();
        return b ? this.fmtDate(this.parseDay(b.day)) : null;
    });

    /** Band-change cohorts over the chosen window (the action card's chips) and the biggest
     *  individual movers — both fetched from the stored SQL queries whenever the baseline
     *  changes. Derived from history snapshots server-side, so they survive the no-op-re-run
     *  case that zeroes the stored Score.Delta. */
    public readonly actionFlows = signal<BandFlow[]>([]);
    public readonly actionMovers = signal<{ risers: WindowMover[]; fallers: WindowMover[] }>({ risers: [], fallers: [] });
    public readonly hasMovers = computed(() => this.actionMovers().risers.length > 0 || this.actionMovers().fallers.length > 0);

    /** Monotonic token so a slow response for an abandoned window can't overwrite a newer one. */
    private actionFetchToken = 0;
    /** Re-fetch the action card whenever the model or the chosen baseline changes. Previous
     *  content stays on screen until the (fast, aggregated) queries land — no layout flicker. */
    private readonly loadActionCard = effect(() => {
        const model = this.model();
        const h = this.history();
        const b = this.actionBaseline();
        if (!model || !h || !b) {
            this.actionFlows.set([]);
            this.actionMovers.set({ risers: [], fallers: [] });
            return;
        }
        const toDay = h.days[h.days.length - 1];
        const token = ++this.actionFetchToken;
        void Promise.all([
            this.scoreRead.flowsBetween(model.ID, b.day, toDay),
            this.scoreRead.moversBetween(model.ID, b.day, toDay, 4),
        ]).then(([flows, movers]) => {
            if (token !== this.actionFetchToken) return; // a newer window superseded this fetch
            this.actionFlows.set(flows);
            this.actionMovers.set(movers);
        });
    });

    /** A yyyy-MM-dd day key → local Date (avoids the UTC shift `new Date(string)` applies). */
    private parseDay(day: string): Date {
        const [y, m, d] = day.split("-").map(Number);
        return new Date(y, (m ?? 1) - 1, d ?? 1);
    }

    /** anchorRecordId → display name cache for mover rows (snapshots only carry IDs). */
    private readonly moverNames = signal<Map<string, string>>(new Map());
    public moverName(anchorRecordId: string): string {
        return this.moverNames().get(anchorRecordId) ?? "…";
    }
    /** Resolve names for whichever movers are showing; merges into the cache so switching
     *  windows back and forth doesn't re-fetch. untracked() on the cache keeps this from
     *  retriggering itself when it writes. */
    private readonly resolveMoverNames = effect(() => {
        const movers = this.actionMovers();
        const anchorEntityId = this.model()?.AnchorEntityID;
        const ids = [...movers.risers, ...movers.fallers].map((m) => m.anchorRecordId);
        if (!anchorEntityId || ids.length === 0) return;
        const missing = ids.filter((id) => !untracked(this.moverNames).has(id));
        if (missing.length === 0) return;
        void this.scoreRead.namesForAnchors(anchorEntityId, missing).then((names) => {
            if (names.size === 0) return;
            const merged = new Map(untracked(this.moverNames));
            for (const [id, name] of names) merged.set(id, name);
            this.moverNames.set(merged);
        });
    });

    // ── Derived: recompute dates + headline ─────────────────────────────────────

    /** The last two trend points (previous and current recompute), when they exist. */
    private readonly currPoint = computed<BandTrendPoint | null>(() => this.trend().at(-1) ?? null);
    private readonly prevPoint = computed<BandTrendPoint | null>(() => (this.trend().length >= 2 ? this.trend().at(-2)! : null));

    /** Short display date (e.g. "Jun 22"). */
    public fmtDate(d: Date | null | undefined): string {
        return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
    }

    /** The plain-language "what changed" facts the hero leads with. */
    public readonly headline = computed<Headline | null>(() => {
        if (this.distribution().length === 0) return null;
        const curr = this.currPoint();
        const prev = this.prevPoint();
        const flows = this.flows();
        const declined = flows.filter((f) => f.worse).reduce((s, f) => s + f.count, 0);
        const improved = flows.filter((f) => !f.worse).reduce((s, f) => s + f.count, 0);
        const total = this.scoredCount() || 1;
        return {
            kind: !prev ? "first" : flows.length === 0 ? "steady" : "moved",
            declined,
            improved,
            movedPct: Math.round(((declined + improved) / total) * 1000) / 10,
            worstLabel: this.worstSlice()?.label ?? "the lowest band",
            topFlow: flows[0] ?? null,
            prevDate: this.fmtDate(prev?.asOf),
            currDate: this.fmtDate(curr?.asOf),
        };
    });

    /** The most severe band that currently has members — the standing cohort worth working. */
    public readonly worstSlice = computed<BandSlice | null>(() => {
        const slices = this.distribution();
        if (slices.length === 0) return null;
        return [...slices].sort((a, b) => BAND_ORDER.indexOf(b.key) - BAND_ORDER.indexOf(a.key))[0];
    });

    /** Eyebrow caption for the active hero view (plain identity when there's nothing plotted). */
    public readonly heroEyebrow = computed<string>(() => {
        const h = this.headline();
        if (!h) return "Population health";
        const view = this.heroView();
        if (view === "flow" && h.kind !== "first") return `Band migration · ${h.prevDate} → ${h.currDate}`;
        if (view === "mix" && this.trend().length >= 2) return `Band mix · last ${this.trend().length} recomputes`;
        return h.kind === "first" ? "Population health" : `Population health · since ${h.prevDate}`;
    });

    // ── Derived: insight table ───────────────────────────────────────────────────

    /** Insight rows keyed by band severity. Counts aggregate by band KEY (the same keying the
     *  trend uses), so prev→curr deltas line up with the sparklines by construction. */
    public readonly insightRows = computed<InsightRow[]>(() => {
        const slices = this.distribution();
        if (slices.length === 0) return [];
        const curr = this.currPoint();
        const prev = this.prevPoint();
        const total = this.scoredCount() || 1;
        const sparkMax = this.sharedSparkMax();
        return this.aggregateByKey(slices).map((s) => {
            const prevCount = prev ? prev.counts[s.key] : null;
            const delta = prevCount != null ? s.count - prevCount : null;
            return {
                key: s.key, label: s.label, count: s.count,
                pct: Math.round((s.count / total) * 100),
                prev: prevCount, delta,
                tone: this.deltaTone(s.key, delta),
                spark: curr ? this.buildSpark(s.key, sparkMax) : null,
            };
        });
    });

    /** Collapse slices sharing a band key (e.g. two labels both mapping to "watch") into one row,
     *  since trend counts are keyed by BandKey. Rows come out in severity order. */
    private aggregateByKey(slices: BandSlice[]): { key: BandKey; label: string; count: number }[] {
        const byKey = new Map<BandKey, { key: BandKey; label: string; count: number }>();
        for (const s of slices) {
            const row = byKey.get(s.key);
            if (row) { row.count += s.count; row.label = `${row.label} / ${s.label}`; }
            else byKey.set(s.key, { key: s.key, label: s.label, count: s.count });
        }
        return BAND_ORDER.filter((k) => byKey.has(k)).map((k) => byKey.get(k)!);
    }

    /** Growth in an unhealthy band is bad; growth in Healthy is good; middle bands stay neutral
     *  (a Watch member may have come from either direction, so no color judgment). */
    private deltaTone(key: BandKey, delta: number | null): "worse" | "better" | "flat" {
        if (delta == null || delta === 0) return "flat";
        if (key === "healthy") return delta > 0 ? "better" : "worse";
        if (key === "atrisk" || key === "critical") return delta > 0 ? "worse" : "better";
        return "flat";
    }

    /** Largest share (%) any band reaches across the trend — ONE y-domain for every sparkline. */
    private sharedSparkMax(): number {
        let max = 0;
        for (const p of this.trend()) {
            if (p.total === 0) continue;
            for (const k of BAND_ORDER) max = Math.max(max, (p.counts[k] / p.total) * 100);
        }
        return Math.max(max, 1);
    }

    /** SVG path for one band's share-over-recomputes sparkline (shared 0..max y-domain). */
    private buildSpark(key: BandKey, maxShare: number): InsightRow["spark"] {
        const points = this.trend();
        if (points.length < 2) return null;
        const W = 120, H = 28, padY = 3;
        const x = (i: number): number => 2 + (i * (W - 8)) / (points.length - 1);
        const y = (share: number): number => padY + (1 - share / maxShare) * (H - padY * 2);
        const coords = points.map((p, i) => ({ x: x(i), y: y(p.total > 0 ? (p.counts[key] / p.total) * 100 : 0) }));
        const line = "M " + coords.map((c) => `${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" L ");
        const last = coords[coords.length - 1];
        const area = `${line} L ${last.x.toFixed(1)} ${H - 1} L ${coords[0].x.toFixed(1)} ${H - 1} Z`;
        return { line, area, endX: last.x, endY: last.y };
    }

    // ── Derived: migration flow (real transitions, not synthetic percentages) ───

    /** Bands present at either of the last two recomputes, severity-ordered — the node column. */
    private readonly flowKeys = computed<BandKey[]>(() => {
        const prev = this.prevPoint(), curr = this.currPoint();
        return BAND_ORDER.filter((k) => (prev?.counts[k] ?? 0) > 0 || (curr?.counts[k] ?? 0) > 0);
    });

    public readonly flowLeftNodes = computed<FlowNode[]>(() => this.flowNodes(this.prevPoint()));
    public readonly flowRightNodes = computed<FlowNode[]>(() => this.flowNodes(this.currPoint()));

    private flowNodes(point: BandTrendPoint | null): FlowNode[] {
        const labels = new Map(this.distribution().map((s) => [s.key, s.label]));
        return this.flowKeys().map((k) => ({
            key: k,
            label: labels.get(k) ?? k,
            count: point?.counts[k] ?? 0,
        }));
    }

    /** Ribbons for the real movement cohorts, colored by direction (decline vs recovery). */
    public readonly flowLinks = computed<FlowLink[]>(() => {
        const keys = this.flowKeys();
        const total = this.prevPoint()?.total ?? this.scoredCount() ?? 1;
        if (keys.length === 0 || total === 0) return [];
        // The SVG canvas is 200×240; nodes are vertically centered per slot (space-around in CSS).
        const yFor = (k: BandKey): number => (240 / keys.length) * (keys.indexOf(k) + 0.5);
        return this.flows().map((f) => {
            const y1 = yFor(f.fromKey), y2 = yFor(f.toKey);
            const width = Math.max(2, Math.min(20, (f.count / total) * 60));
            // Labels sit at the curve's t=0.75 point (near the destination), so two crossing
            // ribbons don't stack their labels at the shared midpoint. Bézier at t=0.75 with
            // both control points at x=100: x ≈ 141, y ≈ 0.156·y1 + 0.844·y2.
            return {
                d: `M 0,${y1} C 100,${y1} 100,${y2} 200,${y2}`,
                width,
                worse: f.worse,
                count: f.count,
                labelX: 141,
                labelY: 0.156 * y1 + 0.844 * y2 - width / 2 - 4,
            };
        });
    });

    // ── Derived: band mix (discrete stacked columns — scores step per recompute,
    //    they don't drift between them, so no continuous-curve implication) ──────

    public readonly mixColumns = computed<MixColumn[]>(() =>
        this.trend().map((p) => ({
            dateLabel: this.fmtDate(p.asOf),
            segments: BAND_ORDER
                .filter((k) => p.counts[k] > 0)
                .map((k) => ({ key: k, pct: p.total > 0 ? (p.counts[k] / p.total) * 100 : 0 })),
        })),
    );

    /** Legend rows for the mix view — the CURRENT distribution, severity-ordered. */
    public readonly mixLegend = computed(() => this.insightRows().map((r) => ({ key: r.key, label: r.label, count: r.count, pct: r.pct })));

    // ── Derived: header metadata + attention ───────────────────────────────────

    /** Share of the population that's been scored (coverage). Null when population is unknown. */
    public readonly coveragePct = computed<number | null>(() => {
        const pop = this.population();
        if (!pop || pop <= 0) return null;
        return Math.round((this.scoredCount() / pop) * 100);
    });

    /** The last recompute's display date for the header metadata line ("—" until scored). */
    public readonly lastRecomputeLabel = computed<string | null>(() => {
        const curr = this.currPoint();
        return curr ? this.fmtDate(curr.asOf) : null;
    });

    /** Delta pill class + signed label for a mover (only ever called with a real, non-null delta). */
    public deltaClass(delta: number | null): string {
        if (delta == null || delta === 0) return "sonar-delta--flat";
        return delta > 0 ? "sonar-delta--up" : "sonar-delta--down";
    }
    public deltaText(delta: number | null): string {
        if (delta == null || delta === 0) return "0";
        return delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`;
    }

    /** Attention items for the current model (config gaps that block scoring). */
    public readonly attention = computed<string[]>(() => {
        const m = this.model();
        if (!m) return [];
        const items: string[] = [];
        if (this.signalCount() === 0) items.push("No signals yet — add factors to the rubric in Model Builder.");
        if (this.bandCount() === 0) items.push("No bands defined — add a band set so scores map to health bands.");
        if (m.Status === "Draft") items.push("Still a draft — publish a version to persist scores.");
        if (m.Status === "Active" && this.scoredCount() === 0) items.push("Published but never recomputed — run Recompute in Model Builder.");
        return items;
    });

    public async GetResourceDisplayName(_data: ResourceData): Promise<string> { return "Sonar"; }
    public async GetResourceIconClass(_data: ResourceData): Promise<string> { return "fa-solid fa-wave-square"; }

    public override ngOnInit(): void {
        super.ngOnInit();
        void this.hydrate();
    }

    private async hydrate(): Promise<void> {
        try {
            const id = this.current.modelId();
            if (id) await this.loadModel(id);
        } finally {
            this.loaded.set(true);
            this.NotifyLoadComplete();
        }
    }

    /** The sidebar picked a model — load its dashboard. */
    public async onSelect(id: string): Promise<void> {
        await this.loadModel(id);
    }

    /** Load the selected model's identity, config counts, and persisted distribution. */
    private async loadModel(id: string): Promise<void> {
        this.loadingModel.set(true);
        try {
            const model = await this.modelService.get(id);
            this.model.set(model);
            if (!model) { this.resetContext(); return; }

            const anchor = new Metadata().Entities.find((e) => e.ID === model.AnchorEntityID);
            this.anchorName.set(anchor?.DisplayName || anchor?.Name || "—");

            const [rubric, dist, trend] = await Promise.all([
                this.factorService.rubricForModel(model.ID),
                this.scoreRead.distributionForModel(model.ID),
                this.scoreRead.overviewTrendForModel(model.ID),
            ]);
            this.signalCount.set(rubric.length);
            this.distribution.set(dist.slices);
            this.scoredCount.set(dist.total);
            this.history.set(trend);
            // Hero flows are the fixed last-two-recomputes lens (the action card's window varies).
            this.flows.set(
                trend.days.length >= 2
                    ? await this.scoreRead.flowsBetween(model.ID, trend.days[trend.days.length - 2], trend.days[trend.days.length - 1])
                    : [],
            );
            // The model's TrendWindowDays is the DEFAULT lens for the action card (when it
            // matches a picker option); the user can still flip timeframes freely from there.
            const tw = model.TrendWindowDays;
            this.actionWindow.set(tw === 30 || tw === 90 || tw === 365 ? tw : "run");
            this.bandCount.set(model.BandSetID ? (await this.bandService.getBands(model.BandSetID)).length : 0);

            this.population.set(null);
            if (anchor) {
                const countResult = await new RunView().RunView({ EntityName: anchor.Name, ResultType: "count_only" });
                this.population.set(countResult?.Success ? countResult.TotalRowCount : null);
            }
        } finally {
            this.loadingModel.set(false);
        }
    }

    private resetContext(): void {
        this.anchorName.set("—");
        this.population.set(null);
        this.signalCount.set(0);
        this.bandCount.set(0);
        this.scoredCount.set(0);
        this.distribution.set([]);
        this.history.set(null);
        this.flows.set([]);
        this.actionWindow.set("run");
        this.moverNames.set(new Map());
    }

    /** Chip class for the model's status. */
    public statusClass(status: string): string {
        if (status === "Active") return "sonar-chip--healthy";
        if (status === "Draft") return "sonar-chip--watch";
        if (status === "Paused") return "sonar-chip--atrisk";
        return "";
    }
}
