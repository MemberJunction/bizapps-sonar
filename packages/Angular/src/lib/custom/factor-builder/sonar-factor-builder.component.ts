import { Component, computed, output, signal } from "@angular/core";
import { CompositeFilterDescriptor, FilterFieldInfo, createEmptyFilter } from "@memberjunction/ng-filter-builder";

/** Aggregations the v1 engine compiler actually implements (factorSql.ts). */
const V1_AGGREGATIONS = ["Count", "Sum", "Avg", "Min", "Max", "DistinctCount"] as const;
type Aggregation = (typeof V1_AGGREGATIONS)[number];

/** Friendly, non-technical labels shown to the user (the stored value stays the enum). */
const AGGREGATION_LABELS: Record<Aggregation, string> = {
    Count: "Count of",
    Sum: "Total of",
    Avg: "Average of",
    Min: "Lowest",
    Max: "Highest",
    DistinctCount: "Unique count of",
};

/** The live preview shape (from the would-be "Sonar: Validate Factor" Action). */
interface FactorPreview { matching: number; strength: number; valid: boolean; }

/**
 * Factor Builder — a friendly, plain-language authoring surface for one signal
 * (see plans/mockups/builder/factor.html and plans/factor-builder-design.md). Opened as a
 * modal from the Model Builder; emits `close` to dismiss.
 *
 * Designed for non-technical authors (HR, membership, etc.): the signal reads as a sentence,
 * engine internals (SQL, normalization method, entity field names) are hidden or tucked into
 * an Advanced section. SCAFFOLD: signal-backed + the real <mj-filter-builder>, but Save is
 * inert. When wired this becomes a BaseFormComponent override; the preview calls the
 * "Sonar: Validate Factor" Action via SonarEngineService.
 */
@Component({
    standalone: false,
    selector: "sonar-factor-builder",
    templateUrl: "./sonar-factor-builder.component.html",
    styleUrls: ["../sonar-shell.css", "./sonar-factor-builder.component.css"],
})
export class SonarFactorBuilderComponent {
    /** Raised when the user closes the builder (Cancel / after a would-be save). */
    public readonly close = output<void>();

    public readonly aggregations = V1_AGGREGATIONS;
    public readonly aggregationLabels = AGGREGATION_LABELS;
    public readonly windows = ["Last 30 days", "Last 90 days", "Last 12 months", "All time"];
    /** Friendly labels for the two scaling options the engine supports. */
    public readonly normalizationOptions = [
        { value: "MinMax", label: "Scale within the group (recommended)" },
        { value: "None", label: "Use the raw number" },
    ];

    // --- composer state (signals; sample defaults) ---
    public readonly factorName = signal("Newsletter engagement");
    public readonly aggregation = signal<Aggregation>("Count");
    public readonly relatedAlias = signal("crm_activity");
    public readonly aggregateField = signal("");
    public readonly window = signal("Last 90 days");
    public readonly normalization = signal("MinMax");
    public readonly higherIsBetter = signal(true);
    public readonly advancedOpen = signal(false);

    /** Related entities wired into the model (TODO wire: Model Related Entities). */
    public readonly relatedEntities = [
        { alias: "crm_activity", label: "Activities" },
        { alias: "invoices", label: "Invoices" },
        { alias: "event_regs", label: "Event Registrations" },
        { alias: "lms_completions", label: "Course Completions" },
    ];

    /** Aggregatable fields on the chosen related entity (TODO wire: EntityInfo.Fields). */
    public readonly relatedFields = ["AmountPaid", "DurationMinutes", "Score", "Quantity"];

    // --- filter (REAL mj-filter-builder) ---
    /** TODO wire: build from the related entity's MJ field metadata. */
    public readonly filterFields: FilterFieldInfo[] = [
        { name: "Type", displayName: "Activity type", type: "string",
          valueList: [
              { value: "Open", label: "Open" },
              { value: "Click", label: "Click" },
              { value: "Bounce", label: "Bounce" },
          ] },
        { name: "Channel", displayName: "Channel", type: "string" },
        { name: "OccurredOn", displayName: "Occurred on", type: "date" },
    ];
    public readonly filter = signal<CompositeFilterDescriptor>(createEmptyFilter());

    // --- preview (TODO wire: "Sonar: Validate Factor" Action) ---
    public readonly preview = signal<FactorPreview>({ matching: 14, strength: 0.62, valid: true });

    /** "Count" tallies matching records — no field needed; the others measure a field. */
    public readonly fieldRequired = computed(() => this.aggregation() !== "Count");

    public toggleAdvanced(): void {
        this.advancedOpen.set(!this.advancedOpen());
    }

    public onFilterChange(f: CompositeFilterDescriptor): void {
        this.filter.set(f);
        // TODO wire: re-run preview via SonarEngineService.validateFactor(draftConfig).
    }
}
