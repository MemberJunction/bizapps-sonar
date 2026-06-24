import { Component, OnInit, computed, inject, input, output, signal } from "@angular/core";
import { ScoreBandService } from "../../../../core/services/score-band.service";

/** One editable band row. `id` is present once the row exists in the DB (drives create vs update). */
interface ScoreBand {
    id?: string;
    label: string;
    min: number;
    max: number;
    severity: number;
    color: string;
    isTerminal: boolean;
}

/**
 * Score-Band Builder — authoring surface for a ScoreBandSet's bands
 * (see plans/mockups/builder/scoreband.html). Hosted inside the Model Builder.
 *
 * WIRED: loads the model's band set (or the first existing set as a starting point) via
 * ScoreBandService, edits the rows, and persists each as a ScoreBand on save (create/update,
 * and delete for removed rows). Emits `saved` with the band set ID so the host can attach the
 * set to the model if it had none. Emits `close` to dismiss without saving.
 */
@Component({
    standalone: false,
    selector: "sonar-score-band-builder",
    templateUrl: "./sonar-score-band-builder.component.html",
    styleUrls: ["../../../../shared/styles/sonar-shell.css", "./sonar-score-band-builder.component.css"],
})
export class SonarScoreBandBuilderComponent implements OnInit {
    private readonly bandService = inject(ScoreBandService);

    /** The model's current band set, or null — when null we load the first existing set to edit. */
    public readonly bandSetId = input<string | null>(null);

    public readonly close = output<void>();
    /** Emits the band set ID that was saved (so the host can point the model at it). */
    public readonly saved = output<string>();

    public readonly scaleMin = 0;
    public readonly scaleMax = 100;

    public readonly setName = signal("Default Health Bands");
    public readonly description = signal("Generic 0–100 health scale for member engagement models.");

    public readonly bands = signal<ScoreBand[]>([
        { label: "Critical", min: 0, max: 40, severity: 3, color: "#ef7d74", isTerminal: true },
        { label: "At-Risk", min: 40, max: 70, severity: 2, color: "#e6ab52", isTerminal: false },
        { label: "Healthy", min: 70, max: 100, severity: 1, color: "#3ddc97", isTerminal: false },
    ]);

    // --- persistence state ---
    /** The set we're actually editing (resolved on load); null until we know. */
    private readonly resolvedSetId = signal<string | null>(null);
    /** IDs of bands that existed in the DB at load — used to detect removals on save. */
    private readonly originalBandIds = signal<string[]>([]);
    public readonly loaded = signal(false);
    public readonly saving = signal(false);

    /** A sample score, to show where it lands on the bands. */
    public readonly sampleScore = signal(73);

    /** Bands widened to render proportionally on the 0–100 number line. */
    public readonly segments = computed(() =>
        this.bands().map((b) => ({ ...b, widthPct: ((b.max - b.min) / (this.scaleMax - this.scaleMin)) * 100 })),
    );

    /** Marker position (%) for the sample score. */
    public readonly markerPct = computed(() => (this.sampleScore() / (this.scaleMax - this.scaleMin)) * 100);

    /** Which band the sample score currently falls in (last band is inclusive of the top). */
    public readonly sampleBand = computed(() => {
        const s = this.sampleScore();
        const bands = this.bands();
        return bands.find((b) => s >= b.min && s < b.max) ?? bands[bands.length - 1];
    });

    /** Coverage warning: bands should tile [scaleMin, scaleMax] with no gaps/overlaps. */
    public readonly coverageOk = computed(() => {
        const sorted = [...this.bands()].sort((a, b) => a.min - b.min);
        if (sorted.length === 0) return false;
        if (sorted[0].min !== this.scaleMin || sorted[sorted.length - 1].max !== this.scaleMax) return false;
        return sorted.every((b, i) => i === 0 || b.min === sorted[i - 1].max);
    });

    /** Save is allowed once loaded, the bands tile the scale, and we're not mid-save. */
    public readonly canSave = computed(() => this.loaded() && this.coverageOk() && !this.saving());

    public async ngOnInit(): Promise<void> {
        try {
            // Prefer the model's own set; otherwise edit the first existing set (e.g. the seeded default).
            const sets = await this.bandService.listSets();
            const target = this.bandSetId()
                ? sets.find((s) => s.ID === this.bandSetId())
                : sets[0];
            if (target) {
                this.resolvedSetId.set(target.ID);
                this.setName.set(target.Name);
                this.description.set(target.Description ?? "");
                const dbBands = await this.bandService.getBands(target.ID);
                if (dbBands.length > 0) {
                    this.bands.set(dbBands.map((b) => ({
                        id: b.ID,
                        label: b.Label,
                        min: b.MinScore,
                        max: b.MaxScore,
                        severity: b.Severity,
                        color: b.ColorHex ?? "#94A3B8",
                        isTerminal: b.IsTerminal,
                    })));
                    this.originalBandIds.set(dbBands.map((b) => b.ID));
                }
            }
        } finally {
            this.loaded.set(true);
        }
    }

    /** Patch one field on a band immutably so the signal (and the preview) updates. */
    public patchBand(index: number, patch: Partial<ScoreBand>): void {
        const next = this.bands().slice();
        next[index] = { ...next[index], ...patch };
        this.bands.set(next);
    }

    public addBand(): void {
        const last = this.bands()[this.bands().length - 1];
        this.bands.set([
            ...this.bands(),
            { label: "New band", min: last ? last.max : this.scaleMin, max: this.scaleMax, severity: 0, color: "#94A3B8", isTerminal: false },
        ]);
    }

    public removeBand(index: number): void {
        this.bands.set(this.bands().filter((_, i) => i !== index));
    }

    /**
     * Persist the set + its bands. Creates the band set if none was resolved, upserts each row,
     * deletes rows that were removed, then emits `saved` with the band set ID.
     */
    public async save(): Promise<void> {
        if (!this.canSave()) return;
        this.saving.set(true);
        try {
            // Ensure a band set exists to hang the bands off of.
            const set = await this.bandService.saveSet({
                id: this.resolvedSetId() ?? undefined,
                name: this.setName().trim() || "Untitled bands",
                description: this.description(),
            });
            if (!set) return;
            this.resolvedSetId.set(set.ID);

            // Upsert every current band.
            const keptIds: string[] = [];
            for (const b of this.bands()) {
                const savedBand = await this.bandService.saveBand({
                    id: b.id,
                    bandSetID: set.ID,
                    label: b.label,
                    minScore: b.min,
                    maxScore: b.max,
                    severity: b.severity,
                    colorHex: b.color,
                    isTerminal: b.isTerminal,
                });
                if (savedBand?.ID) keptIds.push(savedBand.ID);
            }

            // Delete bands that were present at load but removed in the editor.
            const removed = this.originalBandIds().filter((id) => !keptIds.includes(id));
            for (const id of removed) await this.bandService.deleteBand(id);
            this.originalBandIds.set(keptIds);

            this.saved.emit(set.ID);
        } finally {
            this.saving.set(false);
        }
    }
}
