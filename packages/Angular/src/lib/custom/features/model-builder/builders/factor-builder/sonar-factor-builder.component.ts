import { Component, computed, effect, inject, input, output, signal, WritableSignal } from "@angular/core";
import { Metadata, RunView } from "@memberjunction/core";
import { CompositeFilterDescriptor, FilterDescriptor, FilterFieldInfo, createEmptyFilter, isCompositeFilter } from "@memberjunction/ng-filter-builder";
import { FactorService, Aggregation, CreateFactorInput, EditFactorVM, NormalizationMethod, PARAMETERIZED_NORMALIZATION, WeightMode, PromotionState } from "../../../../core/services/factor.service";
import { ActionCatalogService, FactorAction, FactorActionContract } from "../../../../core/services/action-catalog.service";
import { SonarEngineService } from "../../../../core/services/sonar-engine.service";
import { ScoreModelService } from "../../../../core/services/score-model.service";
import { candidatePaths, toRelationshipPath, CandidatePath } from "../../../../core/entity-graph";

/** The two authoring modes the builder forks into (UI-local; maps to Factor.FactorType on save). */
type BuilderMode = "data" | "action";

/** One editable row of a Banded / Lookup table (kept as strings; parsed on serialize). */
interface ParamRow { left: string; output: string; }
/** One route offered in the in-context tie chooser: a readable chain + the RelationshipPath it saves. */
interface TiePathOption { label: string; relationshipPath: string; }

/** Authoring steps in the builder's left rail. Filter is data-mode only (actions have no filter). */
type StepKey = "signal" | "filter" | "scale" | "weight";
/** A step entry in the jumpable sidebar: which step, its label/icon, and whether it's configured. */
interface BuilderStep { key: StepKey; label: string; icon: string; done: boolean; }

/** Friendly labels for every normalization method (incl. the parameterized ones) — used in the summary. */
const NORMALIZATION_LABELS: Record<NormalizationMethod, string> = {
    MinMax: "Scale (Min-Max)",
    Percentile: "Rank (Percentile)",
    ZScore: "Standardize (Z-Score)",
    None: "Raw value",
    Logistic: "Curve (Logistic)",
    Banded: "Steps (Banded)",
    Lookup: "Table (Lookup)",
};

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
export interface FactorSource { id: string; alias: string; label: string; relatedEntityID: string; relationshipPath: string | null; }
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
    private readonly catalog = inject(ActionCatalogService);
    private readonly engine = inject(SonarEngineService);
    private readonly models = inject(ScoreModelService);
    /** DEV MOCK: localStorage.sonarMockTie='1' forces the selected source to look ambiguous so the
     *  in-context path chooser can be exercised (no ambiguous source exists in the demo data). */
    private readonly mockTie = typeof localStorage !== "undefined" && localStorage.getItem("sonarMockTie") === "1";

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
    public readonly isNameEdited = signal(false);
    public readonly aggregation = signal<Aggregation>("Count");
    public readonly sourceId = signal<string | null>(null);
    public readonly aggregateField = signal("");
    public readonly windowId = signal<string | null>(null);
    public readonly normalization = signal<NormalizationMethod>("MinMax");
    public readonly higherIsBetter = signal(true);
    public readonly saving = signal(false);

    // --- fixed-shape normalization params (only used when a parameterized method is selected) ---
    /** Logistic: raw value mapping to the 0.5 midpoint + curve steepness (kept as strings). */
    public readonly logisticMidpoint = signal("");
    public readonly logisticSteepness = signal("1");
    /** Banded rows: `left` = upper bound (blank = open-ended top band), `output` = 0–1 point. */
    public readonly bands = signal<ParamRow[]>([{ left: "", output: "" }]);
    /** Lookup rows: `left` = discrete raw value, `output` = 0–1 point; plus a fallback for misses. */
    public readonly lookupEntries = signal<ParamRow[]>([{ left: "", output: "" }]);
    public readonly lookupFallback = signal("0");
    /** True when the selected method needs a param form (drives the conditional panel). */
    public readonly normalizationParameterized = computed(() =>
        PARAMETERIZED_NORMALIZATION.has(this.normalization()),
    );

    // --- Banded / Lookup row editing (immutable updates so dependent computeds re-run) ---
    private addRow(sig: WritableSignal<ParamRow[]>): void {
        sig.update((rows) => [...rows, { left: "", output: "" }]);
    }
    private removeRow(sig: WritableSignal<ParamRow[]>, i: number): void {
        sig.update((rows) => (rows.length > 1 ? rows.filter((_, idx) => idx !== i) : rows));
    }
    private setRow(sig: WritableSignal<ParamRow[]>, i: number, field: keyof ParamRow, v: string): void {
        sig.update((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: v } : r)));
    }
    public addBand(): void { this.addRow(this.bands); }
    public removeBand(i: number): void { this.removeRow(this.bands, i); }
    public setBand(i: number, field: keyof ParamRow, v: string): void { this.setRow(this.bands, i, field, v); }
    public addLookup(): void { this.addRow(this.lookupEntries); }
    public removeLookup(i: number): void { this.removeRow(this.lookupEntries, i); }
    public setLookup(i: number, field: keyof ParamRow, v: string): void { this.setRow(this.lookupEntries, i, field, v); }

    /** All params for the selected fixed-shape method are present + numeric (parameterless → always ok). */
    public readonly normalizationConfigValid = computed<boolean>(() => {
        const method = this.normalization();
        if (method === "Logistic") {
            return this.isNum(this.logisticMidpoint()) && this.isNum(this.logisticSteepness());
        }
        if (method === "Banded") {
            return this.bands().some((b) => this.isNum(b.output));
        }
        if (method === "Lookup") {
            return this.lookupEntries().some((e) => this.isNum(e.left) && this.isNum(e.output));
        }
        return true; // None / MinMax / Percentile / ZScore take no params
    });

    /** True when a trimmed string parses to a finite number (blank → false). */
    private isNum(v: string): boolean {
        return v.trim() !== "" && Number.isFinite(Number(v));
    }

    /**
     * Serialize the param form into the engine's NormalizationParamsJSON contract for the selected
     * method, or undefined for parameterless methods. Drops incomplete rows; the shapes match
     * normalizationStrategies.parseNormalizationParams ({midpoint,steepness} / {bands} / {entries,fallback}).
     */
    private buildNormalizationParamsJSON(): string | undefined {
        const method = this.normalization();
        if (method === "Logistic") {
            return JSON.stringify({
                midpoint: Number(this.logisticMidpoint()),
                steepness: Number(this.logisticSteepness()),
            });
        }
        if (method === "Banded") {
            const bands = this.bands()
                .filter((b) => this.isNum(b.output))
                .map((b) => ({ max: b.left.trim() === "" ? null : Number(b.left), output: Number(b.output) }));
            return bands.length > 0 ? JSON.stringify({ bands }) : undefined;
        }
        if (method === "Lookup") {
            const entries = this.lookupEntries()
                .filter((e) => this.isNum(e.left) && this.isNum(e.output))
                .map((e) => ({ value: Number(e.left), output: Number(e.output) }));
            const fallback = this.isNum(this.lookupFallback()) ? Number(this.lookupFallback()) : 0;
            return entries.length > 0 ? JSON.stringify({ entries, fallback }) : undefined;
        }
        return undefined;
    }

    /** Pre-fill the param signals from a saved factor's NormalizationParamsJSON (edit mode). */
    private hydrateNormalizationParams(method: NormalizationMethod, json: string | null): void {
        if (!json) return;
        let parsed: unknown;
        try { parsed = JSON.parse(json); } catch { return; }
        if (!parsed || typeof parsed !== "object") return;
        const p = parsed as Record<string, unknown>;
        if (method === "Logistic") {
            this.logisticMidpoint.set(String(p["midpoint"] ?? ""));
            this.logisticSteepness.set(String(p["steepness"] ?? "1"));
        } else if (method === "Banded" && Array.isArray(p["bands"])) {
            this.bands.set((p["bands"] as Array<Record<string, unknown>>).map((b) => ({
                left: b["max"] == null ? "" : String(b["max"]),
                output: String(b["output"] ?? ""),
            })));
        } else if (method === "Lookup" && Array.isArray(p["entries"])) {
            this.lookupEntries.set((p["entries"] as Array<Record<string, unknown>>).map((e) => ({
                left: String(e["value"] ?? ""),
                output: String(e["output"] ?? ""),
            })));
            this.lookupFallback.set(String(p["fallback"] ?? "0"));
        }
    }

    // --- mode: "data" (declarative) vs "action" (custom signal) ---
    /** Which authoring fork is active. Maps to Factor.FactorType on save. */
    public readonly mode = signal<BuilderMode>("data");

    // --- action-backed state (signals) ---
    /** Factor-actions available to bind (loaded once from the catalog). */
    public readonly actions = signal<FactorAction[]>([]);
    public readonly actionId = signal<string | null>(null);
    /** Entered values for the selected action's config params, keyed by param name. */
    public readonly actionParamValues = signal<Record<string, string>>({});
    /** Governance state of this action factor (engine includes only 'Approved' in real scores). */
    public readonly promotionState = signal<PromotionState>("Draft");
    public readonly promotionOptions: { value: PromotionState; label: string }[] = [
        { value: "Draft", label: "Draft — preview only, excluded from scoring" },
        { value: "InReview", label: "In review — excluded from scoring" },
        { value: "Approved", label: "Approved — included in scoring" },
        { value: "Deprecated", label: "Deprecated — excluded from scoring" },
    ];

    // --- weight / mode (how the signal counts in the rubric) ---
    /** Weight as a 0–100 percentage; stored as a 0–1 fraction. */
    public readonly weight = signal(20);
    public readonly weightMode = signal<WeightMode>("Additive");

    /** True once an edit VM has been hydrated into the composer signals (one-shot guard). */
    private hydrated = false;

    public onNameChange(val: string): void {
        this.isNameEdited.set(val.trim().length > 0);
        this.factorName.set(val);
    }

    /** Switch authoring fork. Clears the live preview (it's data-mode only) so a stale
     *  declarative preview doesn't linger behind the action form. */
    public onModeChange(mode: BuilderMode): void {
        this.mode.set(mode);
        this.currentStep.set("signal"); // step set differs by mode (no Filter for actions)
        if (mode === "action") this.preview.set(null);
    }

    /** The chosen factor-action (resolved from actionId). */
    public readonly selectedAction = computed(() => this.actions().find((a) => a.id === this.actionId()) ?? null);

    /** Pick an action: reset the param form to that action's declared defaults, and (unless the
     *  name was hand-edited) seed the factor name from the action's name. */
    public onActionChange(id: string | null): void {
        this.actionId.set(id);
        const action = this.actions().find((a) => a.id === id) ?? null;
        const seeded: Record<string, string> = {};
        for (const p of action?.params ?? []) {
            if (p.defaultValue != null) seeded[p.name] = p.defaultValue;
        }
        this.actionParamValues.set(seeded);
        if (!this.isNameEdited() && action) this.factorName.set(action.name);
        if (action) this.higherIsBetter.set(action.contract.output.higherIsBetter);
    }

    /** Set one action param value (immutably, so the canSave computed re-runs). */
    public setParam(name: string, value: string): void {
        this.actionParamValues.update((prev) => ({ ...prev, [name]: value }));
    }

    /** All required params of the selected action have a non-blank value. */
    public readonly actionConfigValid = computed<boolean>(() => {
        const action = this.selectedAction();
        if (!action) return false;
        const values = this.actionParamValues();
        return action.params
            .filter((p) => p.isRequired)
            .every((p) => (values[p.name] ?? "").trim().length > 0);
    });

    /** One-line output summary for the "What this signal does" panel (unit · range · direction · sample). */
    public outputSummary(c: FactorActionContract): string {
        const parts: string[] = [];
        if (c.output.unit) parts.push(c.output.unit);
        if (c.output.min != null || c.output.max != null) {
            parts.push(`${c.output.min ?? "−∞"}–${c.output.max ?? "∞"}`);
        }
        parts.push(c.output.higherIsBetter ? "higher is better" : "lower is better");
        if (c.output.sample != null) parts.push(`e.g. ${c.output.sample}`);
        return parts.join(" · ");
    }

    /** Execution-profile chips for the "What this signal does" panel. */
    public costTags(c: FactorActionContract): string[] {
        const tags = [c.cost.deterministic ? "Deterministic" : "Non-deterministic"];
        if (c.cost.externalCalls) tags.push("Calls external service");
        if (c.cost.expensive) tags.push("Expensive");
        return tags;
    }

    public applyPreset(type: string): void {
        const src = this.selectedSource();
        if (!src) return;

        this.isNameEdited.set(false); // Enable auto-naming

        if (type === "recent") {
            this.aggregation.set("Count");
            this.aggregateField.set("");
            const w30 = this.windows().find(
                (w) =>
                    w.name.toLowerCase().includes("30") ||
                    w.name.toLowerCase().includes("month"),
            );
            if (w30) this.windowId.set(w30.id);
            this.normalization.set("MinMax");
            this.higherIsBetter.set(true);
            this.weight.set(50);
        } else if (type === "volume") {
            this.aggregation.set("Sum");
            const numericFields = this.aggregatableFields();
            if (numericFields.length > 0) {
                this.aggregateField.set(numericFields[0].name);
            }
            const wAll = this.windows().find((w) =>
                w.name.toLowerCase().includes("all"),
            );
            if (wAll) this.windowId.set(wAll.id);
            this.normalization.set("MinMax");
            this.higherIsBetter.set(true);
            this.weight.set(50);
        } else if (type === "peak") {
            this.aggregation.set("Max");
            const numericFields = this.aggregatableFields();
            if (numericFields.length > 0) {
                this.aggregateField.set(numericFields[0].name);
            }
            const wAll = this.windows().find((w) =>
                w.name.toLowerCase().includes("all"),
            );
            if (wAll) this.windowId.set(wAll.id);
            this.normalization.set("Percentile");
            this.higherIsBetter.set(true);
            this.weight.set(50);
        } else if (type === "decay") {
            this.aggregation.set("Count");
            this.aggregateField.set("");
            const wAll = this.windows().find((w) =>
                w.name.toLowerCase().includes("all"),
            );
            if (wAll) this.windowId.set(wAll.id);
            this.normalization.set("MinMax");
            this.higherIsBetter.set(false); // Warning sign!
            this.weight.set(30);
        }
    }

    constructor() {
        // Load the factor-action catalog once (for the "custom signal" mode picker).
        void this.catalog.listFactorActions().then((list) => this.actions.set(list));

        // Reactive Auto-Naming Effect (data mode only — action mode names from the action).
        effect(() => {
            if (this.mode() !== "data") return;
            if (this.isNameEdited()) return;
            const agg = this.aggregation();
            const src = this.selectedSource();
            const fldName = this.aggregateField();
            const winId = this.windowId();

            if (!src) return;

            let fldLabel = fldName;
            if (fldName) {
                const f = this.aggregatableFields().find((x) => x.name === fldName);
                if (f) fldLabel = f.label;
            }

            let genName = "";
            if (agg === "Count") {
                genName = `Count of ${src.label}`;
            } else if (agg === "Sum") {
                genName = `Total of ${src.label} ${fldLabel || "Field"}`;
            } else if (agg === "Avg") {
                genName = `Average of ${src.label} ${fldLabel || "Field"}`;
            } else if (agg === "Min") {
                genName = `Lowest ${fldLabel || "Field"} on ${src.label}`;
            } else if (agg === "Max") {
                genName = `Highest ${fldLabel || "Field"} on ${src.label}`;
            } else if (agg === "DistinctCount") {
                genName = `Unique count of ${fldLabel || "Field"} in ${src.label}`;
            }

            if (winId) {
                const w = this.windows().find((x) => x.id === winId);
                if (w && w.name && w.name.toLowerCase() !== "all time") {
                    genName += ` (${w.name})`;
                }
            }

            this.factorName.set(genName);
        });

        // Edit mode: pre-fill the composer from the loaded factor exactly once. Runs before the
        // "default to first option" effects so they see populated values and skip.
        effect(() => {
            const vm = this.edit();
            if (!vm || this.hydrated) return;
            this.hydrated = true;
            this.factorName.set(vm.name);
            this.isNameEdited.set(true); // Pre-saved factor is considered edited
            this.mode.set(vm.factorType === "ActionBacked" ? "action" : "data");
            this.aggregation.set(vm.aggregation);
            this.sourceId.set(vm.sourceRelatedEntityID);
            this.aggregateField.set(vm.aggregateFieldName ?? "");
            this.windowId.set(vm.timeWindowID);
            this.actionId.set(vm.actionID);
            this.actionParamValues.set({ ...vm.actionParams });
            this.promotionState.set(vm.promotionState);
            this.normalization.set(vm.normalizationMethod);
            this.hydrateNormalizationParams(vm.normalizationMethod, vm.normalizationParamsJSON);
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
            const dataMode = this.mode() === "data";
            this.aggregation(); this.aggregateField(); this.windowId();
            this.normalization(); this.higherIsBetter(); this.filter();
            // re-preview when fixed-shape params change
            this.logisticMidpoint(); this.logisticSteepness(); this.bands(); this.lookupEntries(); this.lookupFallback();
            const unresolvedTie = !!this.sourceTie(); // reading it also re-fires preview once resolved
            if (this.previewTimer) clearTimeout(this.previewTimer);
            // An unresolved tie can't compile — hold the preview until the path is chosen.
            if (!dataMode || !model || !source || unresolvedTie) { this.preview.set(null); return; }
            this.previewTimer = setTimeout(() => void this.runPreview(), 500);
        });
    }

    /** The currently chosen data source (resolved from sourceId). */
    public readonly selectedSource = computed(() => this.sources().find((s) => s.id === this.sourceId()) ?? null);

    // ── In-context tie resolution: the picked source is reachable several ways → choose the path ──
    /** Source ids whose tie the user resolved this session (clears the chooser without a host reload). */
    private readonly resolvedTies = signal<Set<string>>(new Set());

    /** The candidate routes for the selected source when it's reachable several ways AND not yet
     *  resolved (null = nothing to choose: unique path, unreachable, or already resolved). Drives the
     *  inline chooser under the sentence — in-context per the source you just picked. */
    public readonly sourceTie = computed<TiePathOption[] | null>(() => {
        const src = this.selectedSource();
        const anchorId = this.anchorEntityID();
        if (!src || !anchorId || this.resolvedTies().has(src.id)) return null;
        if (this.mockTie) {
            return [
                { label: "Members → Enrollments → Events", relationshipPath: JSON.stringify([{ fks: ["EnrollmentID"] }, { fks: ["EventID"] }]) },
                { label: "Members → Registrations → Events", relationshipPath: JSON.stringify([{ fks: ["RegistrationID"] }, { fks: ["EventID"] }]) },
            ];
        }
        const existing = (src.relationshipPath ?? "").trim();
        if (existing && existing !== "[]") return null; // already has an explicit path
        const md = new Metadata();
        const business = md.Entities.filter((e) => !e.SchemaName?.startsWith("__mj"));
        const nameOf = (id: string): string => md.Entities.find((e) => e.ID === id)?.Name ?? id;
        const paths = candidatePaths(business, anchorId, src.relatedEntityID);
        if (paths.length < 2) return null; // unique or unreachable → no tie to resolve
        return paths.map((p) => ({ label: this.describePath(p, nameOf), relationshipPath: toRelationshipPath(p) }));
    });

    /** Render a route as an anchor → … → leaf chain (e.g. "Members → Enrollments → Events"). */
    private describePath(path: CandidatePath, nameOf: (id: string) => string): string {
        if (path.hops.length === 0) return "";
        const leafToAnchor = [path.hops[0].fromEntityId, ...path.hops.map((h) => h.toEntityId)];
        return leafToAnchor.reverse().map(nameOf).join(" → ");
    }

    /** Save the chosen path on the source (so every signal on it follows that route), then clear
     *  the chooser. The preview re-runs once the tie is resolved (it reads resolvedTies). */
    public async resolveSourcePath(relationshipPath: string): Promise<void> {
        const src = this.selectedSource();
        if (!src) return;
        if (!this.mockTie) {
            await this.models.setSourcePath(src.id, relationshipPath);
        }
        this.resolvedTies.update((s) => new Set(s).add(src.id));
    }

    /** The model's wired data sources — all selectable here. Reachability (and tie disambiguation)
     *  is enforced when a source is WIRED, in the Model Builder's add-source picker: an unreachable
     *  entity can't be added, and an ambiguous one gets an explicit RelationshipPath at wire time.
     *  So every wired source is already recompute-safe — re-filtering by raw FK reachability here
     *  would wrongly hide a resolved-tie source (its path is explicit, not graph-derivable). */
    public readonly selectableSources = computed<FactorSource[]>(() => this.sources());

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

    /** Save is allowed once the model/name basics hold and the active mode is fully configured:
     *  data mode needs a source (+ a field for non-Count); action mode needs an action with all
     *  required params filled. */
    public readonly canSave = computed(() => {
        if (this.saving() || !this.modelId() || !this.anchorEntityID() || this.factorName().trim().length === 0 || !this.normalizationConfigValid()) {
            return false;
        }
        return this.mode() === "action"
            ? this.actionConfigValid()
            // An unresolved tie (ambiguous source path) can't compile — block save until it's picked.
            : !!this.selectedSource() && !this.sourceTie() && (!this.fieldRequired() || this.aggregateField().trim().length > 0);
    });

    // ── Stepped builder: jumpable left-rail steps + a persistent right-rail summary ──────────────
    /** Which step's config the middle pane shows. Jumpable — clicking any step in the rail sets it. */
    public readonly currentStep = signal<StepKey>("signal");
    public readonly weightModeOptions: { value: WeightMode; label: string }[] = [
        { value: "Additive", label: "Adds to the score" },
        { value: "Penalty", label: "Subtracts (penalty)" },
    ];

    /** Step 1 (Signal) is configured: data needs a resolved source (+ a field when measuring one);
     *  action needs a chosen action with its required params filled. */
    public readonly signalStepValid = computed(() =>
        this.mode() === "action"
            ? this.actionConfigValid()
            : !!this.selectedSource() && !this.sourceTie() && (!this.fieldRequired() || this.aggregateField().trim().length > 0),
    );

    /** Value-bearing filter conditions (mirrors pruneFilter's keep rule) — for the summary + marker. */
    public readonly filterConditionCount = computed(() => this.countConditions(this.filter()));

    /** The step rail, adapted to the mode (no Filter step for actions). `done` drives the ✓ marker. */
    public readonly steps = computed<BuilderStep[]>(() => {
        const out: BuilderStep[] = [
            { key: "signal", label: "Signal", icon: "fa-bullseye", done: this.signalStepValid() },
        ];
        if (this.mode() === "data") {
            out.push({ key: "filter", label: "Filter", icon: "fa-filter", done: this.filterConditionCount() > 0 });
        }
        out.push({ key: "scale", label: "Scale", icon: "fa-sliders", done: this.normalizationConfigValid() });
        out.push({ key: "weight", label: "Weight", icon: "fa-scale-balanced", done: true });
        return out;
    });

    /** A persistent recap of the signal so far — shown on the right rail across every step. */
    public readonly summary = computed(() => {
        const direction = this.higherIsBetter() ? "Higher is better" : "Lower is better";
        const scale = NORMALIZATION_LABELS[this.normalization()];
        const weight = `${this.weight()}% · ${this.weightMode() === "Penalty" ? "penalty" : "additive"}`;
        if (this.mode() === "action") {
            const act = this.selectedAction();
            return { measure: act?.name ?? "Pick a custom signal", detail: act?.contract.measures ?? "", filter: null as string | null, scale, weight, direction };
        }
        const src = this.selectedSource();
        const agg = this.aggregationLabels[this.aggregation()];
        const fld = this.fieldRequired()
            ? this.aggregatableFields().find((f) => f.name === this.aggregateField())?.label ?? "a value"
            : "records";
        const win = this.windows().find((w) => w.id === this.windowId())?.name ?? "";
        const n = this.filterConditionCount();
        return {
            measure: src ? `${agg} ${fld} in ${src.label}` : "Pick a source",
            detail: win && win.toLowerCase() !== "all time" ? `over ${win}` : "",
            filter: n > 0 ? `${n} condition${n === 1 ? "" : "s"}` : "all records",
            scale,
            weight,
            direction,
        };
    });

    /** Count value-bearing conditions in a filter tree (same keep rule as pruneFilter). */
    private countConditions(filter: CompositeFilterDescriptor): number {
        let n = 0;
        for (const item of filter.filters ?? []) {
            if (isCompositeFilter(item)) n += this.countConditions(item);
            else if (item.field && item.value !== null && item.value !== undefined && item.value !== "") n += 1;
        }
        return n;
    }

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
                normalizationParamsJSON: this.buildNormalizationParamsJSON(),
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

    /** Build the right CreateFactorInput for the active mode (data vs action). */
    private buildInput(modelId: string, anchorEntityID: string): CreateFactorInput {
        const base = {
            name: this.factorName().trim(),
            anchorEntityID,
            scoreModelID: modelId,
            normalizationMethod: this.normalization(),
            normalizationParamsJSON: this.buildNormalizationParamsJSON(),
            higherIsBetter: this.higherIsBetter(),
        };
        if (this.mode() === "action") {
            return { ...base, factorType: "ActionBacked", actionID: this.actionId() ?? undefined, actionParamsJSON: this.buildActionParamsJSON(), promotionState: this.promotionState() };
        }
        const source = this.selectedSource();
        return {
            ...base,
            factorType: "Declarative",
            sourceRelatedEntityID: source?.id,
            aggregation: this.aggregation(),
            aggregateFieldName: this.fieldRequired() ? this.aggregateField().trim() : undefined,
            filterExpression: this.filterExpression(),
            timeWindowID: this.windowId() ?? undefined,
        };
    }

    /** Serialize the entered action params into the engine's `{ params: {...} }` contract, dropping
     *  blanks. Returns undefined when there are no values (engine then uses pure defaults). */
    private buildActionParamsJSON(): string | undefined {
        const params: Record<string, string> = {};
        for (const p of this.selectedAction()?.params ?? []) {
            const v = (this.actionParamValues()[p.name] ?? "").trim();
            if (v.length > 0) params[p.name] = v;
        }
        return Object.keys(params).length > 0 ? JSON.stringify({ params }) : undefined;
    }

    /** Create the Factor and bind it into the model's rubric, then notify the host. */
    public async save(): Promise<void> {
        const modelId = this.modelId();
        const anchorEntityID = this.anchorEntityID();
        if (!this.canSave() || !modelId || !anchorEntityID) return;

        const input = this.buildInput(modelId, anchorEntityID);
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
