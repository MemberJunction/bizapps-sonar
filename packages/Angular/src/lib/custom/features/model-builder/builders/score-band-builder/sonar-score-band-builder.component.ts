import { Component, OnInit, computed, inject, input, output, signal } from "@angular/core";
import { mjBizAppsSonarScoreBandSetEntity } from "@mj-biz-apps/sonar-entities";
import { ScoreBandService } from "../../../../core/services/score-band.service";
import { BandKey, bandKey } from "../../../../core/services/score-read.service";
import { bandsCoverScale } from "../../../../core/band-coverage";
import { ToastService } from "../../../../core/services/toast.service";

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
    private readonly toast = inject(ToastService);

    /** The model's current band set, or null — when null we load the first existing set to edit. */
    public readonly bandSetId = input<string | null>(null);

    public readonly close = output<void>();
    /** Emits the band set ID that was saved (so the host can point the model at it). */
    public readonly saved = output<string>();

    /**
     * The score scale the bands have to tile. Supplied by the host from the selected model's
     * ScoreScaleMin/Max rather than assumed to be 0–100, so a model on a different scale is validated
     * against its own range. Defaults match the schema defaults.
     *
     * Caveat worth knowing: band sets are SHARED across models, so a set used by models with
     * different scales cannot tile both. This validates against the model you're editing from.
     */
    public readonly scaleMin = input(0);
    public readonly scaleMax = input(100);

    /** The blank-slate scaffold a brand-new band set starts from (also the very first default). */
    private static readonly NEW_SET_NAME = "New band set";
    private static readonly NEW_SET_DESC = "0–100 health scale.";
    private static readonly NEW_SET_BANDS: ScoreBand[] = [
        { label: "Critical", min: 0,  max: 30, severity: 4, color: "#ef7d74", isTerminal: true  },
        { label: "At-Risk",  min: 30, max: 55, severity: 3, color: "#e6ab52", isTerminal: false },
        { label: "Watch",    min: 55, max: 75, severity: 2, color: "#f5c542", isTerminal: false },
        { label: "Healthy",  min: 75, max: 100, severity: 1, color: "#3ddc97", isTerminal: false },
    ];

    public readonly setName = signal("Default Health Bands");
    public readonly description = signal("Generic 0–100 health scale for engagement models.");

    public readonly bands = signal<ScoreBand[]>(SonarScoreBandBuilderComponent.NEW_SET_BANDS.map((b) => ({ ...b })));

    /** All existing band sets, for the "switch set" picker. */
    public readonly allSets = signal<mjBizAppsSonarScoreBandSetEntity[]>([]);

    // --- persistence state ---
    /** The set we're actually editing (resolved on load); null = an unsaved new set. Public so the
     *  picker can bind its selected value. */
    public readonly resolvedSetId = signal<string | null>(null);
    /** IDs of bands that existed in the DB at load — used to detect removals on save. */
    private readonly originalBandIds = signal<string[]>([]);
    public readonly loaded = signal(false);
    public readonly saving = signal(false);

    /** A sample score, to show where it lands on the bands. */
    public readonly sampleScore = signal(73);

    /** Bands widened to render proportionally on the 0–100 number line; includes a CSS key for
     *  standardized coloring. Color is derived from severity rank (worst→best maps to
     *  critical→atrisk→watch→healthy) so arbitrary labels always get the right token. */
    public readonly segments = computed(() => {
        const bs = this.bands();
        const SCALE: readonly BandKey[] = ["healthy", "watch", "atrisk", "critical"];
        const sorted = [...bs].sort((a, b) => a.severity - b.severity);
        return bs.map(b => {
            const rank = sorted.indexOf(b);
            const idx = sorted.length <= 1 ? 0 : Math.round((rank / (sorted.length - 1)) * 3);
            return {
                ...b,
                widthPct: ((b.max - b.min) / (this.scaleMax() - this.scaleMin())) * 100,
                cssKey: SCALE[Math.min(idx, 3)] as BandKey,
            };
        });
    });

    /** CSS key for the band the sample score falls in — reuses segment mapping for consistency. */
    public readonly sampleBandKey = computed(() => {
        const s = this.sampleBand();
        if (!s) return "watch" as BandKey;
        return this.segments().find(seg => seg.label === s.label && seg.min === s.min)?.cssKey ?? bandKey(s.label);
    });

    /** Marker position (%) for the sample score. */
    public readonly markerPct = computed(() => (this.sampleScore() / (this.scaleMax() - this.scaleMin())) * 100);

    /** Which band the sample score currently falls in (last band is inclusive of the top). */
    public readonly sampleBand = computed(() => {
        const s = this.sampleScore();
        const bands = this.bands();
        return bands.find((b) => s >= b.min && s < b.max) ?? bands[bands.length - 1];
    });

    /** Coverage warning: bands should tile [scaleMin, scaleMax] with no gaps/overlaps. Shares the
     *  one definition of that invariant with the rail's inline band editor (band-coverage.ts), which
     *  auto-closes seams rather than just refusing to save. */
    public readonly coverageOk = computed(() =>
        bandsCoverScale(
            this.bands().map((b, i) => ({ id: `${i}`, min: b.min, max: b.max })),
            { min: this.scaleMin(), max: this.scaleMax() },
        ),
    );

    /** Save is allowed once loaded, the bands tile the scale, and we're not mid-save. */
    public readonly canSave = computed(() => this.loaded() && this.coverageOk() && !this.saving());

    public async ngOnInit(): Promise<void> {
        try {
            const sets = await this.bandService.listSets();
            this.allSets.set(sets);
            // Prefer the model's own set; otherwise edit the first existing set (e.g. the seeded default).
            const target = this.bandSetId()
                ? sets.find((s) => s.ID === this.bandSetId())
                : sets[0];
            await this.loadSet(target ?? null);
        } finally {
            this.loaded.set(true);
        }
    }

    /** Switch the editor to a different existing set (discards in-flight edits to the previous one).
     *  A null selection is the "new (unsaved)" placeholder — nothing to load. */
    public async selectSet(setId: string | null): Promise<void> {
        if (!setId) return;
        const target = this.allSets().find((s) => s.ID === setId);
        if (target) await this.loadSet(target);
    }

    /** Start a fresh, unsaved band set from the scaffold; Save will create it (not mutate an existing one). */
    public newSet(): void {
        this.resolvedSetId.set(null);
        this.originalBandIds.set([]);
        this.setName.set(SonarScoreBandBuilderComponent.NEW_SET_NAME);
        this.description.set(SonarScoreBandBuilderComponent.NEW_SET_DESC);
        this.bands.set(SonarScoreBandBuilderComponent.NEW_SET_BANDS.map((b) => ({ ...b })));
    }

    /** Load a set's identity + bands into the editor. null → keep the new-set scaffold. */
    private async loadSet(set: mjBizAppsSonarScoreBandSetEntity | null): Promise<void> {
        if (!set) return;
        this.resolvedSetId.set(set.ID);
        this.setName.set(set.Name);
        this.description.set(set.Description ?? "");
        const dbBands = await this.bandService.getBands(set.ID);
        this.bands.set(
            dbBands.length > 0
                ? dbBands.map((b) => ({
                      id: b.ID,
                      label: b.Label,
                      min: b.MinScore,
                      max: b.MaxScore,
                      severity: b.Severity,
                      color: b.ColorHex ?? "#94A3B8",
                      isTerminal: b.IsTerminal,
                  }))
                : SonarScoreBandBuilderComponent.NEW_SET_BANDS.map((b) => ({ ...b })),
        );
        this.originalBandIds.set(dbBands.map((b) => b.ID));
    }

    /** Patch one field on a band immutably so the signal (and the preview) updates. */
    public patchBand(index: number, patch: Partial<ScoreBand>): void {
        const next = this.bands().slice();
        next[index] = { ...next[index], ...patch };
        this.bands.set(next);
    }

    public addBand(): void {
        const bs = this.bands();
        const last = bs[bs.length - 1];
        const maxSeverity = bs.reduce((m, b) => Math.max(m, b.severity), 0);
        this.bands.set([
            ...bs,
            { label: "New band", min: last ? last.max : this.scaleMin(), max: this.scaleMax(), severity: maxSeverity + 1, color: "#94A3B8", isTerminal: false },
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

            // Delete bands that were present at load but removed in the editor. A delete can genuinely
            // be refused (Score.BandID has an FK to the band, so any band with computed scores on it is
            // undeletable), so surface that instead of reporting a clean save — otherwise the editor
            // claims the band is gone while it's still in the set.
            const removed = this.originalBandIds().filter((id) => !keptIds.includes(id));
            const survived: string[] = [];
            let firstError: string | null = null;
            for (const id of removed) {
                const res = await this.bandService.deleteBand(id);
                if (!res.ok) {
                    survived.push(id);
                    firstError ??= res.error ?? "A band couldn't be deleted.";
                }
            }
            if (firstError) this.toast.warning(firstError);
            // Track what's actually in the DB now: the saved rows plus anything that refused to delete.
            this.originalBandIds.set([...keptIds, ...survived]);

            // Refresh the picker so a just-created set (or renamed one) shows up.
            this.allSets.set(await this.bandService.listSets());
            this.saved.emit(set.ID);
        } finally {
            this.saving.set(false);
        }
    }
}
