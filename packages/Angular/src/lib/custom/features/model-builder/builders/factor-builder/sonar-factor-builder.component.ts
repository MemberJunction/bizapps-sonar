import { Component, computed, effect, inject, input, output, signal } from "@angular/core";
import { Metadata, RunView } from "@memberjunction/core";
import { CompositeFilterDescriptor, FilterDescriptor, FilterFieldInfo, createEmptyFilter, isCompositeFilter } from "@memberjunction/ng-filter-builder";
import { FactorService, Aggregation, EditFactorVM, NormalizationMethod, WeightMode } from "../../../../core/services/factor.service";
import { SonarEngineService } from "../../../../core/services/sonar-engine.service";

/** View-model for the live factor preview (a representative member's real numbers). */
interface PreviewVM { sampleName: string; matching: number; strength: number; explanation: string; membersWithData: number; }

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
    private readonly engine = inject(SonarEngineService);

    // --- context from the host (the selected model) ---
    public readonly modelId = input<string | null>(null);
    public readonly anchorEntityID = input<string | null>(null);
    /** Data sources wired into the model (the "records in …" options). */
    public readonly sources = input<FactorSource[]>([]);
    /** Time window options (seeded Time Windows). */
    public readonly windows = input<FactorWindow[]>([]);
    /** When set, the builder edits this existing factor instead of creating a new one. */
    public readonly edit = input<EditFactorVM | null>(null);
    public readonly editing = computed(() => !!this.edit());

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
    public readonly saving = signal(false);

    // --- weight / mode (how the signal counts in the rubric) ---
    /** Weight as a 0–100 percentage; stored as a 0–1 fraction. */
    public readonly weight = signal(20);
    public readonly weightMode = signal<WeightMode>("Additive");

    /** True once an edit VM has been hydrated into the composer signals (one-shot guard). */
    private hydrated = false;

    constructor() {
        // Edit mode: pre-fill the composer from the loaded factor exactly once. Runs before the
        // "default to first option" effects so they see populated values and skip.
        effect(() => {
            const vm = this.edit();
            if (!vm || this.hydrated) return;
            this.hydrated = true;
            this.factorName.set(vm.name);
            this.aggregation.set(vm.aggregation);
            this.sourceId.set(vm.sourceRelatedEntityID);
            this.aggregateField.set(vm.aggregateFieldName ?? "");
            this.windowId.set(vm.timeWindowID);
            this.normalization.set(vm.normalizationMethod);
            this.higherIsBetter.set(vm.higherIsBetter);
            this.weight.set(vm.weightPct);
            this.weightMode.set(vm.weightMode);
            if (vm.filterExpression) {
                try { this.filter.set(JSON.parse(vm.filterExpression) as CompositeFilterDescriptor); } catch { /* keep empty */ }
            }
        });
        // Default the source + window pickers to the first option once the host supplies them
        // (skipped in edit mode — the hydrate effect owns those values).
        effect(() => {
            const srcs = this.selectableSources();
            if (!this.editing() && !this.sourceId() && srcs.length > 0) this.sourceId.set(srcs[0].id);
        });
        effect(() => {
            const wins = this.windows();
            if (!this.editing() && !this.windowId() && wins.length > 0) this.windowId.set(wins[0].id);
        });
        // Live preview: whenever any draft input changes, debounce then re-evaluate on the
        // real population. Reading the signals here registers them as effect dependencies.
        effect(() => {
            const model = this.modelId();
            const source = this.selectedSource();
            this.aggregation(); this.aggregateField(); this.windowId();
            this.normalization(); this.higherIsBetter(); this.filter();
            if (this.previewTimer) clearTimeout(this.previewTimer);
            if (!model || !source) { this.preview.set(null); return; }
            this.previewTimer = setTimeout(() => void this.runPreview(), 500);
        });
    }

    /** The currently chosen data source (resolved from sourceId). */
    public readonly selectedSource = computed(() => this.sources().find((s) => s.id === this.sourceId()) ?? null);

    /** Sources the engine can actually score against this anchor: those whose related entity has a
     *  direct FK to the anchor (single-hop). The currently-selected source is always kept so an
     *  in-progress/edited choice never vanishes. Prevents picking unrelated entities (which would
     *  only fail later at recompute with "expected exactly one foreign key … found 0"). */
    public readonly selectableSources = computed<FactorSource[]>(() => {
        const anchorId = this.anchorEntityID();
        const current = this.sourceId();
        if (!anchorId) return this.sources();
        const md = new Metadata();
        return this.sources().filter((s) => {
            if (s.id === current) return true;
            const ent = md.Entities.find((e) => e.ID === s.relatedEntityID);
            return !!ent && ent.Fields.some((f) => f.RelatedEntityID === anchorId);
        });
    });

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

    // --- filter (REAL mj-filter-builder, fields from the chosen source entity's metadata) ---
    /** The filterable columns of the selected source entity (so authors filter on real fields,
     *  e.g. Payments → PaymentType/Amount/PaidOn). PK + MJ system columns are hidden as noise. */
    public readonly filterFields = computed<FilterFieldInfo[]>(() => {
        const src = this.selectedSource();
        const entity = src ? new Metadata().Entities.find((e) => e.ID === src.relatedEntityID) : null;
        if (!entity) return [];
        return entity.Fields
            .filter((f) => !f.IsPrimaryKey && !f.Name.startsWith("__mj_"))
            .map((f) => ({ name: f.Name, displayName: f.DisplayName || f.Name, type: this.filterFieldType(f.Type) }));
    });
    public readonly filter = signal<CompositeFilterDescriptor>(createEmptyFilter());

    /** Map an MJ/SQL column type to the filter builder's coarse type. */
    private filterFieldType(sqlType: string | null): "string" | "number" | "date" | "boolean" {
        const t = (sqlType ?? "").toLowerCase();
        if (NUMERIC_TYPES.has(t)) return "number";
        if (t === "bit") return "boolean";
        if (t.includes("date") || t.includes("time")) return "date";
        return "string";
    }

    // --- live preview (real, via the "Sonar: Validate Factor" engine Action) ---
    public readonly preview = signal<PreviewVM | null>(null);
    public readonly previewing = signal(false);
    public readonly previewError = signal("");
    private previewTimer: ReturnType<typeof setTimeout> | null = null;

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

    /** Switching the source changes which columns exist, so reset the filter + chosen field to
     *  avoid conditions/fields that reference the previous entity. */
    public onSourceChange(id: string | null): void {
        this.sourceId.set(id);
        this.filter.set(createEmptyFilter());
        this.aggregateField.set("");
    }

    public onFilterChange(f: CompositeFilterDescriptor): void {
        // The preview effect tracks filter(), so setting it re-runs the live preview (debounced).
        this.filter.set(f);
    }

    /**
     * Evaluate the current draft on the live population via the engine and show a representative
     * member. Guards: needs a model + source (and a field for non-Count aggregations).
     */
    private async runPreview(): Promise<void> {
        const modelId = this.modelId();
        const source = this.selectedSource();
        if (!modelId || !source || (this.fieldRequired() && !this.aggregateField().trim())) {
            this.preview.set(null);
            return;
        }
        this.previewing.set(true);
        this.previewError.set("");
        try {
            const res = await this.engine.validateFactor(modelId, {
                aggregation: this.aggregation(),
                sourceRelatedEntityID: source.id,
                aggregateFieldName: this.fieldRequired() ? this.aggregateField().trim() : undefined,
                filterExpression: this.filterExpression(),
                timeWindowID: this.windowId() ?? undefined,
                normalizationMethod: this.normalization(),
                higherIsBetter: this.higherIsBetter(),
            });
            if (res.errors.length > 0) {
                this.previewError.set(res.errors[0]);
                this.preview.set(null);
                return;
            }
            const sampleName = res.anchorId ? await this.resolveSampleName(res.anchorId) : "A member";
            this.preview.set({ sampleName, matching: res.matching, strength: res.strength, explanation: res.explanation, membersWithData: res.membersWithData });
        } finally {
            this.previewing.set(false);
        }
    }

    /** Resolve a friendly name for the sample anchor (the engine returns only its ID). */
    private async resolveSampleName(anchorId: string): Promise<string> {
        const entId = this.anchorEntityID();
        const ent = entId ? new Metadata().Entities.find((e) => e.ID === entId) : null;
        if (!ent) return anchorId;
        const pk = ent.PrimaryKeys[0]?.Name ?? "ID";
        const res = await new RunView().RunView<Record<string, unknown>>({ EntityName: ent.Name, ExtraFilter: `${pk}='${anchorId}'`, ResultType: "simple" });
        const row = res.Success ? res.Results?.[0] : undefined;
        if (!row) return anchorId;
        const pick = (k: string): string | null => { const v = row[k]; return v != null && v !== "" ? String(v) : null; };
        const nameField = ent.Fields.find((f) => f.IsNameField)?.Name;
        const composed = [pick("FirstName"), pick("LastName")].filter(Boolean).join(" ");
        return (nameField ? pick(nameField) : null) || composed || pick("Name") || pick("Email") || anchorId;
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

        const input = {
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
        };
        this.saving.set(true);
        try {
            const vm = this.edit();
            const ok = vm
                ? await this.factorService.updateFactor(vm.modelFactorId, vm.factorId, input, this.weight() / 100, this.weightMode())
                : await this.factorService.createAndBind(input, this.weight() / 100, this.weightMode());
            if (ok) this.saved.emit();
        } finally {
            this.saving.set(false);
        }
    }
}
