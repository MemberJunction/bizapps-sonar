import { Component, Input, OnChanges, SimpleChanges, computed, inject, signal } from "@angular/core";
import { BaseEntity, Metadata, RunView } from "@memberjunction/core";
import { SonarEngineService } from "../../../../core/services/sonar-engine.service";

/**
 * Prompt view/edit/test panel for an LLM-backed factor-action — extracted out of the factor builder
 * (which was growing into a god-component). Given the action's `promptName` + the model's anchor
 * entity, it loads the AIPrompt text, lets the author edit + save it, and test it against a sample
 * member (runs the real factor-action → score + reason). Self-contained: all prompt state lives here.
 *
 * Caveats surfaced in the UI: the AIPrompt is shared (editing affects every use) and Test runs the
 * SAVED prompt (save-then-test, not unsaved drafts).
 */
@Component({
    standalone: false,
    selector: "sonar-prompt-editor",
    templateUrl: "./sonar-prompt-editor.component.html",
    styleUrls: ["../../../../shared/styles/sonar-shell.css", "./sonar-prompt-editor.component.css"],
})
export class SonarPromptEditorComponent implements OnChanges {
    private readonly engine = inject(SonarEngineService);

    /** The registered AIPrompt name (from the factor-action's contract.promptName). */
    @Input() public promptName: string | null = null;
    /** The model's anchor entity — used to load sample members for the test picker. */
    @Input() public anchorEntityID: string | null = null;
    /** The factor-action's id — used to run the real action for the test. */
    @Input() public actionId: string | null = null;

    public readonly promptText = signal("");
    private readonly promptOriginalText = signal("");
    private readonly promptTemplateContentId = signal<string | null>(null);
    public readonly promptLoading = signal(false);
    public readonly promptSaving = signal(false);
    public readonly promptError = signal<string | null>(null);
    /** Unsaved edits exist (enables Save; Test runs the SAVED prompt). */
    public readonly promptDirty = computed(() => this.promptText() !== this.promptOriginalText());

    /** Sample members (anchor records) to test the prompt against. */
    public readonly sampleAnchors = signal<{ id: string; label: string }[]>([]);
    public readonly sampleAnchorId = signal<string | null>(null);
    public readonly testing = signal(false);
    public readonly testResult = signal<{ value: number | null; explanation: string | null; error?: string } | null>(null);

    /** Reload when the bound prompt (i.e. the selected action) changes. */
    public ngOnChanges(changes: SimpleChanges): void {
        if (changes["promptName"]) void this.load();
    }

    /** Load the prompt text + a few sample members; clears first so a switch never shows stale text. */
    private async load(): Promise<void> {
        this.reset();
        if (!this.promptName) return;
        this.promptLoading.set(true);
        try {
            const [prompt] = await Promise.all([this.engine.getPrompt(this.promptName), this.loadSampleAnchors()]);
            if (prompt.error) this.promptError.set(prompt.error);
            this.promptText.set(prompt.text);
            this.promptOriginalText.set(prompt.text);
            this.promptTemplateContentId.set(prompt.templateContentId);
        } finally {
            this.promptLoading.set(false);
        }
    }

    private reset(): void {
        this.promptText.set("");
        this.promptOriginalText.set("");
        this.promptTemplateContentId.set(null);
        this.promptError.set(null);
        this.testResult.set(null);
        this.sampleAnchorId.set(null);
    }

    /** Load a handful of anchor records (the model's members) for the test picker. */
    private async loadSampleAnchors(): Promise<void> {
        if (!this.anchorEntityID) return;
        const entity = new Metadata().Entities.find((e) => e.ID === this.anchorEntityID);
        if (!entity) return;
        const nameField = entity.NameField?.Name ?? entity.FirstPrimaryKey.Name;
        const res = await new RunView().RunView<BaseEntity>(
            { EntityName: entity.Name, OrderBy: nameField, MaxRows: 25, ResultType: "entity_object" },
        );
        if (!res.Success) return;
        const rows = (res.Results ?? []).map((r) => ({
            id: String(r.FirstPrimaryKey.Value),
            label: String(r.Get(nameField) ?? r.FirstPrimaryKey.Value),
        }));
        this.sampleAnchors.set(rows);
        if (rows.length > 0) this.sampleAnchorId.set(rows[0].id);
    }

    /** Save the edited prompt text (mutates the shared AIPrompt — affects every use). */
    public async savePrompt(): Promise<void> {
        const contentId = this.promptTemplateContentId();
        if (!contentId || this.promptSaving()) return;
        this.promptSaving.set(true);
        this.promptError.set(null);
        try {
            const res = await this.engine.updatePrompt(contentId, this.promptText());
            if (res.ok) this.promptOriginalText.set(this.promptText());
            else this.promptError.set(res.error ?? "Save failed.");
        } finally {
            this.promptSaving.set(false);
        }
    }

    /** Run the factor-action for the chosen sample member (uses the SAVED prompt). */
    public async runPromptTest(): Promise<void> {
        const anchorId = this.sampleAnchorId();
        if (!this.actionId || !anchorId || this.testing()) return;
        this.testing.set(true);
        this.testResult.set(null);
        try {
            this.testResult.set(await this.engine.testFactorAction(this.actionId, anchorId));
        } finally {
            this.testing.set(false);
        }
    }
}
