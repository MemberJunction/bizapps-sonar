import { Component, computed, output, signal } from "@angular/core";

/** One band row — maps to a ScoreBand entity (Label, MinScore, MaxScore, Severity, ColorHex, IsTerminal). */
interface ScoreBand {
    label: string;
    min: number;
    max: number;
    severity: number;
    color: string;
    isTerminal: boolean;
}

/**
 * Score-Band Builder — visual scaffold for authoring a ScoreBandSet's bands
 * (see plans/mockups/builder/scoreband.html). Hosted inside the Model Builder; emits `close`.
 *
 * SCAFFOLD: band rows are fully editable (signal-backed) and the number-line preview reacts,
 * but Save is inert and the rows are sample data. When wired, each row saves as a ScoreBand
 * under the ScoreBandSet referenced by ScoreModel.BandSetID.
 */
@Component({
    standalone: false,
    selector: "sonar-score-band-builder",
    templateUrl: "./sonar-score-band-builder.component.html",
    styleUrls: ["../sonar-shell.css", "./sonar-score-band-builder.component.css"],
})
export class SonarScoreBandBuilderComponent {
    public readonly close = output<void>();

    public readonly scaleMin = 0;
    public readonly scaleMax = 100;

    public readonly setName = signal("Default Health Bands");
    public readonly description = signal("Generic 0–100 health scale for member engagement models.");

    public readonly bands = signal<ScoreBand[]>([
        { label: "Critical", min: 0, max: 40, severity: 3, color: "#F87171", isTerminal: true },
        { label: "At-Risk", min: 40, max: 70, severity: 2, color: "#FBBF24", isTerminal: false },
        { label: "Healthy", min: 70, max: 100, severity: 1, color: "#2DD4BF", isTerminal: false },
    ]);

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
}
