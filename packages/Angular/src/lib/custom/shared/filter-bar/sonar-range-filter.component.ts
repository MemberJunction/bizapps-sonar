import { Component, input, output } from "@angular/core";

/** An inclusive numeric range; either bound null = unbounded on that end. */
export interface SonarRange { min: number | null; max: number | null; }

/**
 * SonarRangeFilter — a labeled min–max number pair (a bite-sized filter unit). Clamps each bound
 * to [min,max], treats empty as "unbounded", and emits the merged range. Uses .sonar-input.
 */
@Component({
    standalone: false,
    selector: "sonar-range-filter",
    templateUrl: "./sonar-range-filter.component.html",
    styleUrls: ["../styles/sonar-shell.css", "./sonar-range-filter.component.css"],
})
export class SonarRangeFilterComponent {
    public readonly label = input<string>("");
    public readonly value = input<SonarRange>({ min: null, max: null });
    public readonly min = input<number>(0);
    public readonly max = input<number>(100);

    public readonly valueChange = output<SonarRange>();

    /** A bound changed: clamp (empty → null), merge with the other bound, emit. */
    public onBound(which: "min" | "max", raw: string): void {
        const s = raw.trim();
        let n = s === "" ? null : Math.max(this.min(), Math.min(this.max(), Number(s)));
        if (n != null && Number.isNaN(n)) n = null;
        this.valueChange.emit({ ...this.value(), [which]: n });
    }
}
