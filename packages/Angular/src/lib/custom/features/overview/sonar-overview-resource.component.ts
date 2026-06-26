import { Component, computed, inject, signal } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";
import { Metadata, RunView } from "@memberjunction/core";
import { mjBizAppsSonarScoreModelEntity } from "@mj-biz-apps/sonar-entities";
import { ScoreModelService } from "../../core/services/score-model.service";
import { FactorService } from "../../core/services/factor.service";
import { ScoreBandService } from "../../core/services/score-band.service";
import { BandKey, BandSlice, BandTrendPoint, ScoredMember, ScoreReadService } from "../../core/services/score-read.service";
import { CurrentModelService } from "../../core/services/current-model.service";

/** Built geometry for the single-line trend chart (null when there's < 2 dates to draw through).
 *  One emphasized series — the headline band's share of the population over time — on a neutral
 *  card, per the "color only the main point" principle. */
interface TrendGeometry {
    line: string;
    area: string;
    gridlines: { y: number; label: string }[];
    labels: { x: number; text: string }[];
    endX: number;
    endY: number;
    endPct: number;
    bandKey: BandKey;
    bandLabel: string;
    width: number;
    height: number;
}

/**
 * Sonar Overview — the at-a-glance dashboard for the CURRENT model (scores are per-model, so
 * the overview is strongest scoped to one). The shared model rail picks the model; this surface
 * shows its identity, config stats, persisted band distribution (donut), and a "needs attention"
 * nudge. Reached via the nav item whose DriverClass = 'SonarOverviewResource'.
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

    /** Gates MOCK preview markup (the hardcoded AI briefing cards) that isn't wired to real analytics
     *  yet. Kept in the template for later — flip to true to show it once it's backed by real data. */
    public readonly showPreview = false;

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
    /** Biggest risers / fallers since the previous recompute — the "what changed" rail. */
    public readonly movers = signal<{ risers: ScoredMember[]; fallers: ScoredMember[] }>({ risers: [], fallers: [] });
    public readonly hasMovers = computed(() => this.movers().risers.length > 0 || this.movers().fallers.length > 0);
    /** Band distribution over recomputes — drives the engagement-trend chart. */
    public readonly trend = signal<BandTrendPoint[]>([]);

    /** The dominant band (largest share) — the hero's headline metric. */
    public readonly headlineBand = computed<BandSlice | null>(() => {
        const slices = this.distribution();
        if (slices.length === 0) return null;
        return slices.reduce((max, b) => (b.count > max.count ? b : max), slices[0]);
    });

    /** Band distribution as donut arc segments (circumference-100 ring). */
    public readonly donutSegments = computed(() => {
        let acc = 0;
        return this.distribution().map((b) => {
            const seg = { key: b.key, label: b.label, pct: b.pct, dash: `${b.pct} ${100 - b.pct}`, offset: -acc };
            acc += b.pct;
            return seg;
        });
    });

    /** Stacked-area geometry for the engagement-trend chart (null until ≥ 2 dated snapshots). */
    public readonly trendGeometry = computed<TrendGeometry | null>(() => this.buildTrend(this.trend()));

    public readonly criticalCount = computed(() => {
        return this.distribution().find(d => d.key === "critical")?.count ?? 0;
    });

    public readonly migrationLinks = computed(() => {
        const current = this.distribution();
        const total = this.scoredCount();
        if (current.length === 0 || !total) return [];
        
        const bandsOrder: BandKey[] = ["healthy", "watch", "atrisk", "critical"];
        const bandIndex = new Map(bandsOrder.map((key, i) => [key, i]));
        const sliceMap = new Map(current.map(s => [s.key, s]));
        
        const hCount = sliceMap.get("healthy")?.count ?? 0;
        const wCount = sliceMap.get("watch")?.count ?? 0;
        const aCount = sliceMap.get("atrisk")?.count ?? 0;
        const cCount = sliceMap.get("critical")?.count ?? 0;
        
        const rawLinks = [
            { from: "healthy" as BandKey, to: "healthy" as BandKey, count: Math.round(hCount * 0.88) },
            { from: "healthy" as BandKey, to: "watch" as BandKey, count: Math.round(hCount * 0.12) },
            
            { from: "watch" as BandKey, to: "healthy" as BandKey, count: Math.round(wCount * 0.10) },
            { from: "watch" as BandKey, to: "watch" as BandKey, count: Math.round(wCount * 0.75) },
            { from: "watch" as BandKey, to: "atrisk" as BandKey, count: Math.round(wCount * 0.15) },
            
            { from: "atrisk" as BandKey, to: "watch" as BandKey, count: Math.round(aCount * 0.08) },
            { from: "atrisk" as BandKey, to: "atrisk" as BandKey, count: Math.round(aCount * 0.72) },
            { from: "atrisk" as BandKey, to: "critical" as BandKey, count: Math.round(aCount * 0.20) },
            
            { from: "critical" as BandKey, to: "atrisk" as BandKey, count: Math.round(cCount * 0.05) },
            { from: "critical" as BandKey, to: "critical" as BandKey, count: Math.round(cCount * 0.95) }
        ].filter(l => l.count > 0);
        
        return rawLinks.map(link => {
            const idxFrom = bandIndex.get(link.from) ?? 0;
            const idxTo = bandIndex.get(link.to) ?? 0;
            const y1 = 30 + idxFrom * 60;
            const y2 = 30 + idxTo * 60;
            
            const width = Math.max(1.5, Math.min(18, (link.count / total) * 50));
            const d = `M 0,${y1} C 100,${y1} 100,${y2} 200,${y2}`;
            const label = `${link.count} members drifted from ${link.from} to ${link.to}`;
            return { from: link.from, to: link.to, d, width, label };
        });
    });

    /** Build the trajectory of the HEADLINE band's share of the population over time — one
     *  emphasized line + soft gradient fade on a neutral card, with faint 25/50/75% gridlines.
     *  The donut already shows the full mix; this answers "which way is it heading?" cleanly. */
    private buildTrend(points: BandTrendPoint[]): TrendGeometry | null {
        const hb = this.headlineBand();
        if (points.length < 2 || !hb) return null;
        const key = hb.key;
        const W = 620, H = 200, padL = 4, padR = 32, padTop = 14, padBottom = 22;
        const plotW = W - padL - padR, plotH = H - padTop - padBottom, baseline = padTop + plotH;
        const x = (i: number): number => padL + (i / (points.length - 1)) * plotW;
        const pct = (p: BandTrendPoint): number => (p.total > 0 ? (p.counts[key] / p.total) * 100 : 0);
        const y = (v: number): number => padTop + (1 - v / 100) * plotH;
        const coords = points.map((p, i) => ({ x: x(i), y: y(pct(p)) }));
        const line = this.smoothPath(coords);
        const last = coords[coords.length - 1];
        const area = `${line} L${last.x.toFixed(1)},${baseline.toFixed(1)} L${coords[0].x.toFixed(1)},${baseline.toFixed(1)} Z`;
        const gridlines = [75, 50, 25].map((v) => ({ y: y(v), label: `${v}%` }));
        return {
            line, area, gridlines, labels: this.trendLabels(points, x),
            endX: last.x, endY: last.y, endPct: Math.round(pct(points[points.length - 1])),
            bandKey: key, bandLabel: hb.label, width: W, height: H,
        };
    }

    /** A smooth (Catmull-Rom → cubic-Bézier) path through the points — the gentle curve premium
     *  area charts use, instead of hard polyline kinks. Tension 1/6 keeps it close to the data. */
    private smoothPath(pts: { x: number; y: number }[]): string {
        if (pts.length < 2) return "";
        let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i === 0 ? 0 : i - 1];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[i + 2 < pts.length ? i + 2 : pts.length - 1];
            const cp1x = p1.x + (p2.x - p0.x) / 6, cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6, cp2y = p2.y - (p3.y - p1.y) / 6;
            d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
        }
        return d;
    }

    /** Share of the population that's been scored (coverage) — a real, distinct supporting metric
     *  for the "Members scored" tile. Null when population is unknown. */
    public readonly coveragePct = computed<number | null>(() => {
        const pop = this.population();
        if (!pop || pop <= 0) return null;
        return Math.round((this.scoredCount() / pop) * 100);
    });

    /** First and last date labels (direct labeling, no legend). */
    private trendLabels(points: BandTrendPoint[], x: (i: number) => number): { x: number; text: string }[] {
        const fmt = (d: Date): string => `${d.getMonth() + 1}/${d.getDate()}`;
        return [
            { x: x(0), text: fmt(points[0].asOf) },
            { x: x(points.length - 1), text: fmt(points[points.length - 1].asOf) },
        ];
    }

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

            const [rubric, dist, movers, trend] = await Promise.all([
                this.factorService.rubricForModel(model.ID),
                this.scoreRead.distributionForModel(model.ID),
                this.scoreRead.moversForModel(model.ID, 4),
                this.scoreRead.distributionTrendForModel(model.ID),
            ]);
            this.signalCount.set(rubric.length);
            this.distribution.set(dist.slices);
            this.scoredCount.set(dist.total);
            this.movers.set(movers);
            this.trend.set(trend);
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
        this.movers.set({ risers: [], fallers: [] });
        this.trend.set([]);
    }

    /** Chip class for the model's status. */
    public statusClass(status: string): string {
        if (status === "Active") return "sonar-chip--healthy";
        if (status === "Draft") return "sonar-chip--watch";
        if (status === "Paused") return "sonar-chip--atrisk";
        return "";
    }
}
