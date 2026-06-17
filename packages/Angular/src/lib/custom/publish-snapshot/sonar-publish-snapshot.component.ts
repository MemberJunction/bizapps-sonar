import { Component, OnInit, computed, inject, input, output, signal } from "@angular/core";
import { RunView } from "@memberjunction/core";
import { mjBizAppsSonarScoreModelEntity, mjBizAppsSonarScoreModelVersionEntity } from "@mj-biz-apps/sonar-entities";
import { ScoreModelService } from "../services/score-model.service";

/** One row of the publish gate. `na` = not applicable (e.g. no custom formula in use). */
type GateStatus = "pass" | "fail" | "na";
interface GateCheck { label: string; detail: string; status: GateStatus; }
/** A published immutable version — maps to ScoreModelVersion. */
interface ModelVersion { number: number; label: string; when: string; isCurrent: boolean; summary?: string; }

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
    styleUrls: ["../sonar-shell.css", "./sonar-publish-snapshot.component.css"],
})
export class SonarPublishSnapshotComponent implements OnInit {
    private readonly modelService = inject(ScoreModelService);

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

    public async ngOnInit(): Promise<void> {
        const m = this.model();
        if (!m) return;
        const result = await new RunView().RunView<mjBizAppsSonarScoreModelVersionEntity>({
            EntityName: "MJ_BizApps_Sonar: Score Model Versions",
            ExtraFilter: `ScoreModelID='${m.ID}'`,
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

    /** Publish: flip Status → Active + Save (fires the server snapshot hook). */
    public async publish(): Promise<void> {
        const m = this.model();
        if (!m || !this.canPublish() || this.publishing()) return;
        this.publishing.set(true);
        this.error.set("");
        try {
            const res = await this.modelService.publish(m.ID);
            if (res.ok) this.published.emit();
            else this.error.set(res.error ?? "Publish failed.");
        } finally {
            this.publishing.set(false);
        }
    }
}
