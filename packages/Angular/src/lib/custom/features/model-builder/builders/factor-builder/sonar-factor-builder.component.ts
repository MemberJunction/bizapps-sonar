import { Component, computed, effect, inject, input, output, signal } from "@angular/core";
import { Metadata } from "@memberjunction/core";
import { CompositeFilterDescriptor, FilterDescriptor, FilterFieldInfo, createEmptyFilter, isCompositeFilter } from "@memberjunction/ng-filter-builder";
import { FactorService, Aggregation, NormalizationMethod, WeightMode } from "../../../../core/services/factor.service";

/** Aggregations the v1 engine compiler actually implements (factorSql.ts). */
const V1_AGGREGATIONS = ["Count", "Sum", "Avg", "Min", "Max", "DistinctCount"] as const;

/** Friendly, non-technical labels shown to the user (the stored value stays the enum). */
const AGGREGATION_LABELS: Record<Aggregation, string> = {
    Count: "Count of",
    Sum: "Total of",
    Avg: "Average of",
    Min: "Lowest",
    Max: "Highest",
    DistinctCount: "Unique count of",
};

/** MJ field types that make sense to Sum/Avg/Min/Max over. */
const NUMERIC_TYPES = new Set(["int", "bigint", "smallint", "tinyint", "decimal", "numeric", "money", "smallmoney", "float", "real"]);

/** A data source wired into the model (a Model Related Entity), passed in by the host. */
export interface FactorSource { id: string; alias: string; label: string; relatedEntityID: string; }
/** A time window option (a seeded Time Window), passed in by the host. */
export interface FactorWindow { id: string; name: string; }

/**
 * Factor Builder — a friendly, plain-language authoring surface for one signal
 * (see plans/mockups/builder/factor.html and plans/factor-builder-design.md). Opened as a
 * modal from the Model Builder; emits `close` to dismiss or `saved` after a successful write.
 *
 * Designed for non-technical authors: the signal reads as a sentence, engine internals are
 * hidden or tucked into an Advanced section. WIRED for persistence — on save it creates a
 * Declarative Factor and binds it into the model's rubric (FactorService.createAndBind). The
 * live preview (matching count / strength) still awaits the "Sonar: Validate Factor" engine
 * Action and shows indicative sample numbers until then.
 */
@Component({
    standalone: false,
    selector: "sonar-factor-builder",
    templateUrl: "./sonar-factor-builder.component.html",
    styleUrls: ["../../../../shared/styles/sonar-shell.css", "./sonar-factor-builder.component.css"],
})
export class SonarFactorBuilderComponent {
    private readonly factorService = inject(FactorService);

    // --- context from the host (the selected model) ---
    public readonly modelId = input<string | null>(null);
    public readonly anchorEntityID = input<string | null>(null);
    /** Data sources wired into the model (the "records in …" options). */
    public readonly sources = input<FactorSource[]>([]);
    /** Time window options (seeded Time Windows). */
    public readonly windows = input<FactorWindow[]>([]);

    /** Raised when the user closes the builder (Cancel). */
    public readonly close = output<void>();
    /** Raised after a factor is created + bound into the model's rubric. */
    public readonly saved = output<void>();

    public readonly aggregations = V1_AGGREGATIONS;
    public readonly aggregationLabels = AGGREGATION_LABELS;
    /** Friendly labels for the scaling methods the engine supports (population-relative). */
    public readonly normalizationOptions: { value: NormalizationMethod; label: string }[] = [
        { value: "MinMax", label: "Scale within the group (recommended)" },
        { value: "Percentile", label: "Rank within the group (robust to outliers)" },
        { value: "ZScore", label: "Standardize around the average" },
        { value: "None", label: "Use the raw number" },
    ];

    // --- composer state (signals) ---
    public readonly factorName = signal("");
    public readonly aggregation = signal<Aggregation>("Count");
    public readonly sourceId = signal<string | null>(null);
    public readonly aggregateField = signal("");
    public readonly windowId = signal<string | null>(null);
    public readonly normalization = signal<NormalizationMethod>("MinMax");
    public readonly higherIsBetter = signal(true);
    public readonly advancedOpen = signal(false);
    public readonly saving = signal(false);

    // --- weight / mode (how the signal counts in the rubric) ---
    /** Weight as a 0–100 percentage; stored as a 0–1 fraction. */
    public readonly weight = signal(20);
    public readonly weightMode = signal<WeightMode>("Additive");

    constructor() {
        // Default the source + window pickers to the first option once the host supplies them.
        effect(() => {
            const srcs = this.sources();
            if (!this.sourceId() && srcs.length > 0) this.sourceId.set(srcs[0].id);
        });
        effect(() => {
            const wins = this.windows();
            if (!this.windowId() && wins.length > 0) this.windowId.set(wins[0].id);
        });
    }

    /** The currently chosen data source (resolved from sourceId). */
    public readonly selectedSource = computed(() => this.sources().find((s) => s.id === this.sourceId()) ?? null);

    /** Aggregatable (numeric) fields on the chosen source entity, from MJ metadata. */
    public readonly aggregatableFields = computed<{ name: string; label: string }[]>(() => {
        const src = this.selectedSource();
        if (!src) return [];
        const entity = new Metadata().Entities.find((e) => e.ID === src.relatedEntityID);
        if (!entity) return [];
        return entity.Fields
            .filter((fld) => NUMERIC_TYPES.has((fld.Type ?? "").toLowerCase()))
            .map((fld) => ({ name: fld.Name, label: fld.DisplayName || fld.Name }));
    });

    // --- filter (REAL mj-filter-builder) ---
    /** TODO wire: build from the source entity's MJ field metadata (currently generic). */
    public readonly filterFields: FilterFieldInfo[] = [
        { name: "Type", displayName: "Type", type: "string" },
        { name: "Channel", displayName: "Channel", type: "string" },
        { name: "OccurredOn", displayName: "Occurred on", type: "date" },
    ];
    public readonly filter = signal<CompositeFilterDescriptor>(createEmptyFilter());

    // --- preview (TODO wire: "Sonar: Validate Factor" Action — indicative sample for now) ---
    public readonly preview = signal<{ matching: number; strength: number; valid: boolean }>({ matching: 14, strength: 0.62, valid: true });

    /** "Count" tallies matching records — no field needed; the others measure a field. */
    public readonly fieldRequired = computed(() => this.aggregation() !== "Count");

    /** Save is allowed once we have a model, a name, a source, and (if needed) a field. */
    public readonly canSave = computed(() =>
        !this.saving() &&
        !!this.modelId() &&
        !!this.anchorEntityID() &&
        this.factorName().trim().length > 0 &&
        !!this.selectedSource() &&
        (!this.fieldRequired() || this.aggregateField().trim().length > 0),
    );

    public toggleAdvanced(): void {
        this.advancedOpen.set(!this.advancedOpen());
    }

    public onFilterChange(f: CompositeFilterDescriptor): void {
        this.filter.set(f);
        // TODO wire: re-run preview via the "Sonar: Validate Factor" Action.
    }

    /** Serialize the filter only when it has REAL conditions — prune blank/value-less rules
     *  (the builder seeds an empty default rule) so they never reach the engine. */
    private filterExpression(): string | undefined {
        const pruned = this.pruneFilter(this.filter());
        return pruned.filters.length > 0 ? JSON.stringify(pruned) : undefined;
    }

    /** Recursively drop conditions with no value and empty groups. */
    private pruneFilter(filter: CompositeFilterDescriptor): CompositeFilterDescriptor {
        const kept: (FilterDescriptor | CompositeFilterDescriptor)[] = [];
        for (const item of filter.filters ?? []) {
            if (isCompositeFilter(item)) {
                const sub = this.pruneFilter(item);
                if (sub.filters.length > 0) kept.push(sub);
            } else if (item.field && item.value !== null && item.value !== undefined && item.value !== "") {
                kept.push(item);
            }
        }
        return { logic: filter.logic, filters: kept };
    }

    /** Create the Factor and bind it into the model's rubric, then notify the host. */
    public async save(): Promise<void> {
        const modelId = this.modelId();
        const anchorEntityID = this.anchorEntityID();
        const source = this.selectedSource();
        if (!this.canSave() || !modelId || !anchorEntityID || !source) return;

        this.saving.set(true);
        try {
            const ok = await this.factorService.createAndBind(
                {
                    name: this.factorName().trim(),
                    anchorEntityID,
                    scoreModelID: modelId,
                    sourceRelatedEntityID: source.id,
                    aggregation: this.aggregation(),
                    aggregateFieldName: this.fieldRequired() ? this.aggregateField().trim() : undefined,
                    filterExpression: this.filterExpression(),
                    timeWindowID: this.windowId() ?? undefined,
                    normalizationMethod: this.normalization(),
                    higherIsBetter: this.higherIsBetter(),
                },
                this.weight() / 100,
                this.weightMode(),
            );
            if (ok) this.saved.emit();
        } finally {
            this.saving.set(false);
        }
    }
}
