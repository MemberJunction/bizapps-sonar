import { Component, EventEmitter, Input, OnInit, Output, computed, inject, signal } from "@angular/core";
import { Metadata, RunView } from "@memberjunction/core";
import { mjBizAppsSonarModelFactorEntity } from "@mj-biz-apps/sonar-entities";
import { ScoreModelService } from "../../core/services/score-model.service";
import { CurrentModelService } from "../../core/services/current-model.service";

/** A model row in the rail (enriched with the context an operator scans for). */
interface SidebarModel { id: string; name: string; status: string; anchorName: string; signals: number; }

/** Rank for status ordering — published models float to the top of the rail. */
const STATUS_RANK: Record<string, number> = { Active: 0, Paused: 1, Draft: 2 };

/**
 * The Sonar model rail — the app's primary navigation. Scores are per-model, so picking a
 * model here sets the app-wide current model ({@link CurrentModelService}) that every surface
 * scopes to. Shared across surfaces (Overview, Model Builder, Engagement Manager); each host
 * listens to `select` to hydrate its own view, and may call {@link refresh} after creating/
 * publishing a model.
 *
 * Each row shows the model's status, anchor entity, and signal count so the operator can scan
 * the portfolio without opening each one. Rows are grouped published-first.
 */
@Component({
    standalone: false,
    selector: "sonar-model-sidebar",
    templateUrl: "./sonar-model-sidebar.component.html",
    styleUrls: ["../styles/sonar-shell.css", "./sonar-model-sidebar.component.css"],
})
export class SonarModelSidebarComponent implements OnInit {
    private readonly modelService = inject(ScoreModelService);
    private readonly current = inject(CurrentModelService);

    /** Whether to show the "+ New" affordance. Only the Model Builder can host the create
     *  flow, so read-only surfaces (Overview, Engagement Manager) pass false. */
    @Input() public createEnabled = true;

    /** Emitted when the user picks a model (after the current-model selection is set). */
    @Output() public readonly select = new EventEmitter<string>();
    /** Emitted when the user clicks "New model". */
    @Output() public readonly create = new EventEmitter<void>();

    public readonly models = signal<SidebarModel[]>([]);
    public readonly loaded = signal(false);
    /** Free-text filter over model names (only shown once the list is long enough to need it). */
    public readonly query = signal("");
    /** The app-wide selection (read straight off the shared service signal). */
    public readonly selectedId = this.current.modelId;
    /** Whether the models selector sidebar is expanded. */
    public readonly sidebarExpanded = this.current.sidebarExpanded;

    /** Models after the name filter is applied. */
    public readonly visibleModels = computed(() => {
        const q = this.query().trim().toLowerCase();
        const all = this.models();
        return q ? all.filter((m) => m.name.toLowerCase().includes(q)) : all;
    });

    public ngOnInit(): void {
        void this.refresh();
    }

    /** (Re)load the model list with its per-model context. Hosts call this after create/publish. */
    public async refresh(): Promise<void> {
        const models = await this.modelService.list();
        const signalsByModel = await this.loadSignalCounts();
        const md = new Metadata();

        const rows = models.map((m) => {
            const anchor = md.Entities.find((e) => e.ID === m.AnchorEntityID);
            return {
                id: m.ID,
                name: m.Name,
                status: m.Status,
                anchorName: anchor?.DisplayName || anchor?.Name || "—",
                signals: signalsByModel.get(m.ID) ?? 0,
            } satisfies SidebarModel;
        });
        rows.sort((a, b) => (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9));
        this.models.set(rows);
        this.loaded.set(true);

        // If nothing is selected yet, default to the first model so surfaces aren't empty.
        if (!this.current.modelId() && rows.length > 0) this.pick(rows[0].id);
    }

    /** Count rubric signals per model in one read (Model Factors grouped client-side). */
    private async loadSignalCounts(): Promise<Map<string, number>> {
        const result = await new RunView().RunView<mjBizAppsSonarModelFactorEntity>({
            EntityName: "MJ_BizApps_Sonar: Model Factors",
            ResultType: "simple",
            Fields: ["ScoreModelID"],
        });
        const counts = new Map<string, number>();
        for (const row of result.Success ? result.Results ?? [] : []) {
            counts.set(row.ScoreModelID, (counts.get(row.ScoreModelID) ?? 0) + 1);
        }
        return counts;
    }

    /** Select a model: set the shared current model, then notify the host. */
    public pick(id: string): void {
        this.current.select(id);
        this.select.emit(id);
    }

    /** Chip class for a model's status. */
    public statusClass(status: string): string {
        if (status === "Active") return "sonar-chip--healthy";
        if (status === "Draft") return "sonar-chip--watch";
        if (status === "Paused") return "sonar-chip--atrisk";
        return "";
    }

    /** Band-tone key for the compact status dot (Active=healthy, Draft=watch, Paused=atrisk). */
    public statusTone(status: string): string {
        if (status === "Active") return "healthy";
        if (status === "Draft") return "watch";
        if (status === "Paused") return "atrisk";
        return "watch";
    }
}
