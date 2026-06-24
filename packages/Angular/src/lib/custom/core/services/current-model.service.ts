import { Injectable, signal } from "@angular/core";

/**
 * The app-wide "current model" selection — the primary navigation context for Sonar
 * (scores are per-model, so every surface is scoped to one model at a time). Persisted to
 * localStorage so the selection sticks across surfaces and reloads. The model sidebar writes
 * it; Overview / Model Builder / Engagement Manager read it.
 */
@Injectable({ providedIn: "root" })
export class CurrentModelService {
    private static readonly KEY = "sonar.currentModelId";

    /** The selected ScoreModel ID, or null when nothing is chosen yet. */
    public readonly modelId = signal<string | null>(this.read());

    /** Whether the models selector sidebar is expanded. */
    public readonly sidebarExpanded = signal<boolean>(true);

    /** Toggle the models sidebar. */
    public toggleSidebar(): void {
        this.sidebarExpanded.set(!this.sidebarExpanded());
    }

    /** Collapse the models sidebar. */
    public collapseSidebar(): void {
        this.sidebarExpanded.set(false);
    }

    /** Expand the models sidebar. */
    public expandSidebar(): void {
        this.sidebarExpanded.set(true);
    }

    /** Select a model (or clear). Persists across reloads. */
    public select(id: string | null): void {
        this.modelId.set(id);
        try {
            if (id) localStorage.setItem(CurrentModelService.KEY, id);
            else localStorage.removeItem(CurrentModelService.KEY);
        } catch {
            // localStorage unavailable (private mode / SSR) — in-memory selection still works.
        }
    }

    private read(): string | null {
        try { return localStorage.getItem(CurrentModelService.KEY); } catch { return null; }
    }
}
