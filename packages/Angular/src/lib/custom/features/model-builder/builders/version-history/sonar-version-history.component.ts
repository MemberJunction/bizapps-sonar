import { Component, computed, effect, inject, input, output, signal } from "@angular/core";
import { Metadata, RunView } from "@memberjunction/core";
import { mjBizAppsSonarScoreModelVersionEntity } from "@mj-biz-apps/sonar-entities";
import { FactorWindow } from "../factor-builder/sonar-factor-builder.component";
import { ScoreModelService } from "../../../../core/services/score-model.service";
import { ToastService } from "../../../../core/services/toast.service";

/** One row in the version timeline. */
interface VersionListItem { id: string; number: number; title: string; sub: string; isCurrent: boolean; }
/** One factor line in a snapshot's rubric (id = FactorID, for matching across versions). */
interface SnapshotFactorVM { id: string; name: string; measure: string; window: string; normalization: string; weightPct: number; penalty: boolean; }
/** A version's frozen config, rendered read-only. */
interface SnapshotVM { anchor: string; population: string; combine: string; factors: SnapshotFactorVM[]; bands: { label: string; range: string }[]; }
/** One change between two snapshots. */
interface DiffLine { kind: "added" | "removed" | "changed"; label: string; detail: string; }
/** The full diff from a baseline version → the selected version. */
interface VersionDiff { model: DiffLine[]; factors: DiffLine[]; bands: DiffLine[]; unchanged: boolean; }

/** Shape of `ScoreModelVersion.ConfigSnapshotJSON` (built by ScoreModelEntityServer.buildConfigSnapshot). */
interface ConfigSnapshot {
    model?: { Name?: string; AnchorEntityID?: string; PopulationFilter?: string | null; CombineStrategy?: string };
    relatedEntities?: { ID?: string; RelatedEntityID?: string }[];
    modelFactors?: { FactorID?: string; Weight?: number | null; WeightMode?: string | null }[];
    factors?: { ID?: string; Name?: string; Aggregation?: string | null; AggregateFieldName?: string | null; SourceRelatedEntityID?: string | null; TimeWindowID?: string | null; NormalizationMethod?: string | null }[];
    bands?: { Label?: string; MinScore?: number | null; MaxScore?: number | null }[];
}

/**
 * Version History — a per-model, read-only browser for published versions. A timeline on the left
 * (newest first, with the live one chipped); on the right, the SELECTED version's frozen
 * configuration rendered from its immutable `ConfigSnapshotJSON` (anchor, rubric, windows, bands),
 * plus a "what changed" diff against a chosen baseline version (defaults to the immediately prior
 * one). This is what makes "we snapshot config at publish" actually visible + comparable. Opened as
 * a modal from the Model Builder; emits `close`. Read-only — rollback is a later phase.
 */
@Component({
    standalone: false,
    selector: "sonar-version-history",
    templateUrl: "./sonar-version-history.component.html",
    styleUrls: ["../../../../shared/styles/sonar-shell.css", "./sonar-version-history.component.css"],
})
export class SonarVersionHistoryComponent {
    /** The model whose versions to show. */
    public readonly modelId = input<string | null>(null);
    /** Seeded Time Windows (id → name), so a snapshot's TimeWindowID renders as a name. */
    public readonly windows = input<FactorWindow[]>([]);
    public readonly close = output<void>();
    /** Raised after a successful rollback (the host reloads the model + refreshes). */
    public readonly restored = output<void>();

    private readonly modelService = inject(ScoreModelService);
    private readonly toast = inject(ToastService);

    /** The version a restore confirmation is pending on (inline confirm), and the in-flight flag. */
    public readonly pendingRestoreId = signal<string | null>(null);
    public readonly restoring = signal(false);

    public readonly versions = signal<VersionListItem[]>([]);
    public readonly selectedId = signal<string | null>(null);
    /** The baseline the selected version is compared against (null = no comparison). */
    public readonly compareToId = signal<string | null>(null);
    public readonly loading = signal(true);

    /** Raw ConfigSnapshotJSON per version ID (parsed on demand). Populated before any selection. */
    private readonly rawById = new Map<string, string>();

    constructor() {
        effect(() => {
            const id = this.modelId();
            if (id) void this.load(id);
        });
    }

    /** The selected version's parsed snapshot (null if empty / unparseable). */
    public readonly selectedSnapshot = computed(() => this.snapshotFor(this.selectedId()));
    /** The compare-baseline snapshot, when a baseline is chosen. */
    public readonly compareSnapshot = computed(() => this.snapshotFor(this.compareToId()));
    /** True when the selected version has raw JSON that failed to parse. */
    public readonly parseError = computed(() => {
        const id = this.selectedId();
        if (!id) return false;
        return !!this.rawById.get(id) && this.snapshotFor(id) === null;
    });
    /** Versions available as a compare baseline (everything but the selected one). */
    public readonly compareOptions = computed(() => this.versions().filter((v) => v.id !== this.selectedId()));
    /** The diff from the baseline → the selected version (null when no baseline is chosen). */
    public readonly diff = computed<VersionDiff | null>(() => {
        const from = this.compareSnapshot();
        const to = this.selectedSnapshot();
        return from && to ? this.buildDiff(from, to) : null;
    });

    /** Load the model's versions (newest first) and open the most recent one. */
    private async load(modelId: string): Promise<void> {
        this.loading.set(true);
        const result = await new RunView().RunView<mjBizAppsSonarScoreModelVersionEntity>({
            EntityName: "MJ_BizApps_Sonar: Score Model Versions",
            ExtraFilter: `ScoreModelID='${modelId}'`,
            OrderBy: "VersionNumber DESC",
            ResultType: "entity_object",
        });
        const rows = result.Success ? result.Results ?? [] : [];
        this.rawById.clear();
        for (const v of rows) this.rawById.set(v.ID, v.ConfigSnapshotJSON ?? "");
        this.versions.set(rows.map((v) => ({
            id: v.ID,
            number: v.VersionNumber,
            title: `v${v.VersionNumber}${v.VersionLabel ? ` — ${v.VersionLabel}` : ""}`,
            sub: `${v.PublishedByUser ?? "—"} · ${v.PublishedAt ? new Date(v.PublishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}`,
            isCurrent: v.IsCurrent ?? false,
        })));
        this.loading.set(false);
        if (rows.length > 0) this.select(rows[0].ID);
        else { this.selectedId.set(null); this.compareToId.set(null); }
    }

    /** Ask to roll back to a version (shows the inline confirm). */
    public askRestore(versionId: string): void { this.pendingRestoreId.set(versionId); }
    /** Dismiss the inline restore confirm. */
    public cancelRestore(): void { this.pendingRestoreId.set(null); }

    /** Confirm rollback: re-apply the version's config and publish it as a new "Rollback of vN". */
    public async confirmRestore(versionId: string): Promise<void> {
        const modelId = this.modelId();
        if (!modelId || this.restoring()) return;
        this.restoring.set(true);
        try {
            const res = await this.modelService.restoreVersion(modelId, versionId);
            if (res.ok) {
                this.toast.success(`Rolled back — published as v${res.newVersionNumber}. Recompute to refresh scores.`);
                this.pendingRestoreId.set(null);
                await this.load(modelId); // refresh the timeline with the new version
                this.restored.emit();
            } else {
                this.toast.error(res.error || "Rollback failed.");
            }
        } finally {
            this.restoring.set(false);
        }
    }

    /** Select a version; default the compare baseline to the immediately prior (older) version. */
    public select(versionId: string): void {
        this.selectedId.set(versionId);
        const list = this.versions(); // VersionNumber DESC → the next item is the older version
        const i = list.findIndex((v) => v.id === versionId);
        this.compareToId.set(i >= 0 && i + 1 < list.length ? list[i + 1].id : null);
    }

    /** Parse a version's stored snapshot into the read-only view model (or null). */
    private snapshotFor(id: string | null): SnapshotVM | null {
        if (!id) return null;
        const raw = this.rawById.get(id);
        if (!raw) return null;
        let cfg: ConfigSnapshot;
        try {
            cfg = JSON.parse(raw) as ConfigSnapshot;
        } catch {
            return null;
        }
        const md = new Metadata();
        const entityName = (eid?: string | null): string => {
            const e = eid ? md.Entities.find((x) => x.ID === eid) : null;
            return e ? e.DisplayName || e.Name : "—";
        };
        const windowName = new Map(this.windows().map((w) => [w.id, w.name]));

        const factorById = new Map((cfg.factors ?? []).map((f) => [f.ID, f]));
        const factors: SnapshotFactorVM[] = (cfg.modelFactors ?? []).map((mf, idx) => {
            const f = factorById.get(mf.FactorID);
            const agg = f?.Aggregation ?? "Count";
            const measure = agg === "Count" || !f?.AggregateFieldName ? agg : `${agg}(${f.AggregateFieldName})`;
            return {
                id: mf.FactorID ?? `#${idx}`,
                name: f?.Name ?? "(signal)",
                measure,
                window: f?.TimeWindowID ? windowName.get(f.TimeWindowID) ?? "window" : "All time",
                normalization: f?.NormalizationMethod ?? "None",
                weightPct: Math.round((mf.Weight ?? 0) * 100),
                penalty: (mf.WeightMode ?? "Additive") === "Penalty",
            };
        });

        const bands = (cfg.bands ?? [])
            .slice()
            .sort((a, b) => (a.MinScore ?? 0) - (b.MinScore ?? 0))
            .map((b) => ({ label: b.Label ?? "Band", range: `${b.MinScore ?? 0}–${b.MaxScore ?? 100}` }));

        return {
            anchor: entityName(cfg.model?.AnchorEntityID),
            population: cfg.model?.PopulationFilter && cfg.model.PopulationFilter.trim().length > 0 ? "Filtered population" : "All records",
            combine: cfg.model?.CombineStrategy ?? "WeightedSum",
            factors,
            bands,
        };
    }

    /** Diff baseline (`from`) → selected (`to`): model-level changes, factor add/remove/change, band changes. */
    private buildDiff(from: SnapshotVM, to: SnapshotVM): VersionDiff {
        const model: DiffLine[] = [];
        if (from.anchor !== to.anchor) model.push({ kind: "changed", label: "Anchor", detail: `${from.anchor} → ${to.anchor}` });
        if (from.population !== to.population) model.push({ kind: "changed", label: "Population", detail: `${from.population} → ${to.population}` });
        if (from.combine !== to.combine) model.push({ kind: "changed", label: "Combine", detail: `${from.combine} → ${to.combine}` });

        // Match factors by ID first (stable across in-place edits), then fall back to name for
        // leftovers — a ROLLBACK recreates factors with new IDs, so an unchanged factor would
        // otherwise show as a spurious remove + add. Name-matching makes "rollback of vN" diff clean.
        const factors: DiffLine[] = [];
        const fromById = new Map(from.factors.map((f) => [f.id, f]));
        const matched = new Set<SnapshotFactorVM>();
        const unmatchedTo: SnapshotFactorVM[] = [];
        for (const f of to.factors) {
            const old = fromById.get(f.id);
            if (old) {
                matched.add(old);
                const changes = this.factorChanges(old, f);
                if (changes.length) factors.push({ kind: "changed", label: f.name, detail: changes.join(" · ") });
            } else {
                unmatchedTo.push(f);
            }
        }
        const fromByName = new Map<string, SnapshotFactorVM[]>();
        for (const f of from.factors) {
            if (matched.has(f)) continue;
            (fromByName.get(f.name) ?? fromByName.set(f.name, []).get(f.name)!).push(f);
        }
        for (const f of unmatchedTo) {
            const old = fromByName.get(f.name)?.shift();
            if (old) {
                matched.add(old);
                const changes = this.factorChanges(old, f);
                if (changes.length) factors.push({ kind: "changed", label: f.name, detail: changes.join(" · ") });
            } else {
                factors.push({ kind: "added", label: f.name, detail: this.factorDetail(f) });
            }
        }
        for (const f of from.factors) {
            if (!matched.has(f)) factors.push({ kind: "removed", label: f.name, detail: this.factorDetail(f) });
        }

        const bands: DiffLine[] = [];
        const fromBands = new Map(from.bands.map((b) => [b.label, b.range]));
        const toBands = new Map(to.bands.map((b) => [b.label, b.range]));
        for (const b of to.bands) {
            const old = fromBands.get(b.label);
            if (old === undefined) bands.push({ kind: "added", label: b.label, detail: b.range });
            else if (old !== b.range) bands.push({ kind: "changed", label: b.label, detail: `${old} → ${b.range}` });
        }
        for (const b of from.bands) {
            if (!toBands.has(b.label)) bands.push({ kind: "removed", label: b.label, detail: b.range });
        }

        return { model, factors, bands, unchanged: model.length === 0 && factors.length === 0 && bands.length === 0 };
    }

    /** One-line description of a factor (for added/removed lines). */
    private factorDetail(f: SnapshotFactorVM): string {
        return `${f.measure} · ${f.window} · ${f.normalization} · w ${(f.weightPct / 100).toFixed(2)}${f.penalty ? " · penalty" : ""}`;
    }

    /** The field-level changes between two versions of the same factor. */
    private factorChanges(a: SnapshotFactorVM, b: SnapshotFactorVM): string[] {
        const out: string[] = [];
        if (a.weightPct !== b.weightPct) out.push(`weight ${(a.weightPct / 100).toFixed(2)} → ${(b.weightPct / 100).toFixed(2)}`);
        if (a.penalty !== b.penalty) out.push(b.penalty ? "now a penalty" : "no longer a penalty");
        if (a.measure !== b.measure) out.push(`${a.measure} → ${b.measure}`);
        if (a.window !== b.window) out.push(`window ${a.window} → ${b.window}`);
        if (a.normalization !== b.normalization) out.push(`scaling ${a.normalization} → ${b.normalization}`);
        return out;
    }
}
