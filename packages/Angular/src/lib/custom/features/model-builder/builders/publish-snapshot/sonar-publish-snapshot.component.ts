import { Component, OnInit, computed, inject, input, output, signal } from "@angular/core";
import { RunView } from "@memberjunction/core";
import { mjBizAppsSonarScoreModelEntity, mjBizAppsSonarScoreModelVersionEntity } from "@mj-biz-apps/sonar-entities";
import { ScoreModelService } from "../../../../core/services/score-model.service";
import { SonarEngineService } from "../../../../core/services/sonar-engine.service";
import { BandKey, ScoreReadService } from "../../../../core/services/score-read.service";
import { ToastService } from "../../../../core/services/toast.service";

/** One row of the publish gate. `na` = not applicable (e.g. no custom formula in use). */
type GateStatus = "pass" | "fail" | "na";
interface GateCheck { label: string; detail: string; status: GateStatus; }
/** A published immutable version — maps to ScoreModelVersion. */
interface ModelVersion { number: number; label: string; when: string; isCurrent: boolean; summary?: string; }
/** One band's projected-vs-current shift in the pre-publish impact preview. */
interface ImpactRow { label: string; key: BandKey; beforePct: number; afterPct: number; delta: number; }
/** The pre-publish impact preview: how a recompute on this config would shift the distribution. */
interface ImpactPreview { firstScoring: boolean; projectedTotal: number; rows: ImpactRow[]; error: string; }

/**
 * Publish & Snapshot — the publish gate + version history
 * (see plans/mockups/builder/snapshot.html). Hosted inside the Model Builder.
 *
 * WIRED: the four gate checks are computed from the live model (signals, band set, bands,
 * custom formula) and mirror ScoreModelEntityServer.ValidateAsync. Version history loads real
 * ScoreModelVersion rows. Publish flips Status → Active via ScoreModelService.publish(), which
 * fires the server hook that snapshots an immutable version; the server re-validates regardless
 * of the client-side gate. Emits `published` on success, `close` to dismiss.
 */
@Component({
    standalone: false,
    selector: "sonar-publish-snapshot",
    templateUrl: "./sonar-publish-snapshot.component.html",
    styleUrls: ["../../../../shared/styles/sonar-shell.css", "./sonar-publish-snapshot.component.css"],
})
export class SonarPublishSnapshotComponent implements OnInit {
    private readonly modelService = inject(ScoreModelService);
    private readonly engine = inject(SonarEngineService);
    private readonly scoreRead = inject(ScoreReadService);
    private readonly toast = inject(ToastService);

    // --- context from the host ---
    public readonly model = input<mjBizAppsSonarScoreModelEntity | null>(null);
    public readonly signalCount = input<number>(0);
    public readonly bandCount = input<number>(0);

    public readonly close = output<void>();
    public readonly published = output<void>();

    public readonly modelName = computed(() => this.model()?.Name ?? "—");

    /** The publish gate — the same checks the server enforces, in plain language. */
    public readonly checks = computed<GateCheck[]>(() => {
        const m = this.model();
        const signals = this.signalCount();
        const bands = this.bandCount();
        const usesFormula = m?.CombineStrategy === "ExpressionDriven";
        return [
            {
                label: "At least one signal added",
                detail: signals > 0 ? `${signals} signal${signals === 1 ? "" : "s"} in this model` : "No signals yet",
                status: signals > 0 ? "pass" : "fail",
            },
            {
                label: "A band set is chosen",
                detail: m?.BandSetID ? "A band set is attached" : "No band set chosen",
                status: m?.BandSetID ? "pass" : "fail",
            },
            {
                label: "The band set has bands",
                detail: bands > 0 ? `${bands} band${bands === 1 ? "" : "s"} set up` : "No bands in the set",
                status: bands > 0 ? "pass" : "fail",
            },
            {
                label: "Custom formula provided (only if you use one)",
                detail: usesFormula ? (m?.CombineExpression ? "Formula provided" : "Formula is missing") : "Not needed for this model",
                status: usesFormula ? (m?.CombineExpression ? "pass" : "fail") : "na",
            },
        ];
    });

    /** Can publish when no check has failed (the server re-validates regardless). */
    public readonly canPublish = computed(() => this.checks().every((c) => c.status !== "fail"));

    /** What gets saved in the version snapshot, in plain terms. */
    public readonly snapshotParts = computed(() => [
        { title: "Model setup", detail: "who it scores + how" },
        { title: "Signals", detail: `${this.signalCount()}, with their weights` },
        { title: "Bands", detail: `${this.bandCount()}, with their ranges` },
    ]);

    public readonly versions = signal<ModelVersion[]>([]);
    public readonly nextVersion = computed(() => (this.versions()[0]?.number ?? 0) + 1);

    public readonly changeSummary = signal("");

    // --- publish state ---
    public readonly publishing = signal(false);
    public readonly error = signal("");

    // --- pre-publish impact preview ---
    public readonly impact = signal<ImpactPreview | null>(null);
    public readonly impactLoading = signal(false);

    public async ngOnInit(): Promise<void> {
        const m = this.model();
        if (!m) return;
        await this.loadVersions(m.ID);
        void this.loadImpact(m.ID);
    }

    /** Load this model's published version history. */
    private async loadVersions(modelId: string): Promise<void> {
        const result = await new RunView().RunView<mjBizAppsSonarScoreModelVersionEntity>({
            EntityName: "MJ_BizApps_Sonar: Score Model Versions",
            ExtraFilter: `ScoreModelID='${modelId}'`,
            OrderBy: "VersionNumber DESC",
            ResultType: "entity_object",
        });
        if (result.Success) {
            this.versions.set((result.Results ?? []).map((v) => ({
                number: v.VersionNumber,
                label: v.VersionLabel ?? "",
                when: v.PublishedAt ? new Date(v.PublishedAt).toLocaleDateString() : "",
                isCurrent: v.IsCurrent,
                summary: v.ChangeSummary ?? undefined,
            })));
        }
    }

    /**
     * Build the impact preview: run a live preview on the current config and diff its band
     * distribution against the currently-persisted scores. Shows who would move bands once you
     * publish + recompute, so a band shift on publish day is intended, not a surprise.
     */
    private async loadImpact(modelId: string): Promise<void> {
        this.impactLoading.set(true);
        try {
            const [persisted, preview] = await Promise.all([
                this.scoreRead.distributionForModel(modelId),
                this.engine.previewModel(modelId),
            ]);
            if (preview.errors.length > 0) {
                this.impact.set({ firstScoring: false, projectedTotal: 0, rows: [], error: preview.errors[0] });
                return;
            }
            const before = new Map(persisted.slices.map((s) => [s.label, s.pct]));
            const after = new Map(preview.bandDistribution.map((b) => [b.label, b.pct]));
            const labels = [...new Set([...before.keys(), ...after.keys()])];
            const rows: ImpactRow[] = labels.map((label) => {
                const beforePct = before.get(label) ?? 0;
                const afterPct = after.get(label) ?? 0;
                return { label, key: this.bandKey(label), beforePct, afterPct, delta: afterPct - beforePct };
            });
            this.impact.set({ firstScoring: persisted.total === 0, projectedTotal: preview.totalScored, rows, error: "" });
        } finally {
            this.impactLoading.set(false);
        }
    }

    /** Absolute value (template helper for the delta chips). */
    public abs(n: number): number { return Math.abs(n); }

    /** Map an arbitrary band label to a color key (mirrors ScoreReadService). */
    private bandKey(label: string): BandKey {
        const l = label.toLowerCase();
        if (l.includes("healthy")) return "healthy";
        if (l.includes("critical")) return "critical";
        if (l.includes("risk")) return "atrisk";
        return "watch";
    }

    /** Publish: flip Status → Active + Save (fires the server snapshot hook). */
    public async publish(): Promise<void> {
        const m = this.model();
        if (!m || !this.canPublish() || this.publishing()) return;
        this.publishing.set(true);
        this.error.set("");
        try {
            const res = await this.modelService.publish(m.ID);
            if (res.ok) {
                this.toast.success(`Published ${m.Name} as version ${this.nextVersion()}.`);
                this.published.emit();
            } else {
                const message = res.error ?? "Publish failed.";
                this.error.set(message);
                this.toast.error(message);
            }
        } finally {
            this.publishing.set(false);
        }
    }
}
