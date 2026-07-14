import { Component, computed, inject, output, signal } from "@angular/core";
import { Metadata } from "@memberjunction/core";
import { ScoreModelService } from "../../../../core/services/score-model.service";
import { reachableFromAnchor } from "../../../../core/entity-graph";

/** An MJ entity the user can pick as the anchor or a data source. */
interface EntityOption { id: string; name: string; }

/**
 * Model Setup — the "create a model" loop: name it, pick the anchor entity, and wire in the
 * data sources (related entities) that signals will read from. Opened as a modal from the
 * Model Builder; emits `created` (the new model ID) on success or `close` to cancel.
 *
 * This writes REAL rows: ScoreModelService.create() -> a ScoreModel, then addDataSource()
 * -> ModelRelatedEntity rows. The pickers are metadata-driven from MJ's entity catalog.
 */
@Component({
    standalone: false,
    selector: "sonar-model-setup",
    templateUrl: "./sonar-model-setup.component.html",
    styleUrls: ["../../../../shared/styles/sonar-shell.css", "./sonar-model-setup.component.css"],
})
export class SonarModelSetupComponent {
    private readonly models = inject(ScoreModelService);

    public readonly close = output<void>();
    /** Emits the newly-created model's ID. */
    public readonly created = output<string>();

    public readonly name = signal("");
    public readonly anchorEntityID = signal("");
    /** Chosen data-source entity IDs (chips). Aliases are derived from the entity name on save. */
    public readonly dataSourceIds = signal<string[]>([]);
    /** Trend window (days): Delta/Trend compare against the score ~N days ago. Defaults to 30 —
     *  the robust behavior. Cleared (null) = "since the previous recompute", which any no-op
     *  re-run zeroes out, wiping the Overview's movers. */
    public readonly trendWindowDays = signal<number | null>(30);
    public readonly saving = signal(false);
    public readonly error = signal<string | null>(null);

    /** Business entities only (MJ `__mj*` system/infra tables excluded from both pickers). */
    private readonly businessEntities = new Metadata().Entities.filter(
        (e) => !e.SchemaName?.startsWith("__mj"),
    );

    /** Anchor picker: any business entity (reachability is measured FROM the anchor, so it isn't filtered). */
    public readonly anchorOptions: EntityOption[] = this.businessEntities
        .map((e) => ({ id: e.ID, name: e.Name }))
        .sort((a, b) => a.name.localeCompare(b.name));

    /** Data-source picker: only entities the engine can score against the chosen anchor (reachable
     *  by a single FK path). Empty until an anchor is picked. */
    public readonly sourceOptions = computed<EntityOption[]>(() => {
        const anchorId = this.anchorEntityID();
        if (!anchorId) return [];
        const reachable = reachableFromAnchor(this.businessEntities, anchorId);
        return this.businessEntities
            .filter((e) => reachable.has(e.ID))
            .map((e) => ({ id: e.ID, name: e.Name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    });

    public readonly canSave = computed(() => this.name().trim().length > 0 && this.anchorEntityID().length > 0 && !this.saving());

    /** Create the model, then persist the chosen data sources (auto-aliased), then emit the ID. */
    public async save(): Promise<void> {
        if (!this.canSave()) return;
        this.saving.set(true);
        this.error.set(null);
        try {
            const model = await this.models.create({
                name: this.name().trim(),
                anchorEntityID: this.anchorEntityID(),
                trendWindowDays: this.normalizedTrendWindow(),
            });
            if (!model) {
                this.error.set("Couldn't create the model — check the name isn't already taken.");
                return;
            }
            for (const id of this.dataSourceIds()) {
                await this.models.addDataSource({ modelId: model.ID, relatedEntityID: id, alias: this.aliasFor(id) });
            }
            this.created.emit(model.ID);
        } catch (e) {
            this.error.set(e instanceof Error ? e.message : "Something went wrong saving the model.");
        } finally {
            this.saving.set(false);
        }
    }

    /** The trend window as it will persist: a positive whole number of days, or null (an emptied
     *  or nonsense input falls back to "since last recompute" rather than saving garbage). */
    private normalizedTrendWindow(): number | null {
        const days = this.trendWindowDays();
        if (days == null || !Number.isFinite(days) || days < 1) return null;
        return Math.round(days);
    }

    /** Derive a short alias from the entity's name (e.g. "Activities" -> "activities"). */
    private aliasFor(entityId: string): string {
        const name = this.anchorOptions.find((e) => e.id === entityId)?.name ?? entityId;
        return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    }
}
