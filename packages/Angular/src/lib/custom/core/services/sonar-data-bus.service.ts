import { Injectable, Signal, WritableSignal, signal } from "@angular/core";

/**
 * What a surface can invalidate, and what other surfaces can watch for.
 *
 * `scores` — a recompute wrote Score / ScoreHistory / ScoreBandTransition rows for one model.
 * `config` — a model's own configuration changed (published, unpublished, rubric, bands, population).
 * `models` — the set of models itself changed (created, archived), or one's Status/name did, so
 *            every surface's model rail is out of date regardless of which model is selected.
 *
 * A union rather than an enum, per the repo convention (unions export cleanly across packages).
 */
export type SonarInvalidation =
    | { topic: "scores"; modelId: string }
    | { topic: "config"; modelId: string }
    | { topic: "models" };

/**
 * Cross-surface cache invalidation for Sonar.
 *
 * The problem it solves: every Sonar surface loads its data in `ngOnInit` and on model select, and
 * nothing else. MJ Explorer keeps open resource tabs mounted and `BaseResourceComponent` has no
 * activation hook, so returning to a tab never re-runs `ngOnInit`. A recompute in Model Builder
 * therefore leaves every other open tab showing pre-recompute numbers until the browser is reloaded.
 *
 * Reads were never stale by caching — {@link ScoreReadService} has no cache, every read hits the API
 * fresh. The gap was purely that nobody re-read. So this bus carries no data: it is a revision
 * counter per topic. Writers `publish()`; readers call `revision()` inside an `effect()` to subscribe
 * and re-run their own load when it bumps. That keeps each surface in charge of *how* it reloads
 * (preserving the operator's filters, page, and place) instead of a central cache dictating shape.
 *
 * Deliberately NOT MJGlobal events: those are app-wide and untyped, and every Sonar surface is
 * already signal-based, so a signal keeps subscription automatic and teardown free (an `effect()` in
 * an injection context dies with its component).
 */
@Injectable({ providedIn: "root" })
export class SonarDataBusService {
    /**
     * Revision counter per topic key. Lazily created: a topic nobody has watched or published yet
     * has no entry, and the first `revision()` read seeds it at 0 so the caller's effect has a
     * signal to track before the first publish ever lands.
     */
    private readonly revisions = new Map<string, WritableSignal<number>>();

    /**
     * Announce that something changed. Every effect currently reading this topic's revision re-runs.
     *
     * A `scores` or `config` publish is scoped to one model, so surfaces showing a *different* model
     * are left alone rather than needlessly re-querying. Config changes also bump `models`, because a
     * publish/unpublish flips the Status chip that every surface's rail renders.
     */
    public publish(event: SonarInvalidation): void {
        this.bump(SonarDataBusService.keyFor(event));
        if (event.topic === "config") {
            this.bump(SonarDataBusService.keyFor({ topic: "models" }));
        }
    }

    /**
     * Current revision of a topic. Call this INSIDE an `effect()` (or a computed) — reading it is
     * what subscribes the caller. The number itself is meaningless; only its changing matters.
     *
     * Effects run once on creation, so a subscriber sees an immediate first call. Guard the reload
     * if that initial run would duplicate the component's own `ngOnInit` load.
     */
    public revision(event: SonarInvalidation): number {
        return this.signalFor(SonarDataBusService.keyFor(event))();
    }

    /** Read-only handle to a topic's revision, for callers that would rather hold the signal. */
    public revisionSignal(event: SonarInvalidation): Signal<number> {
        return this.signalFor(SonarDataBusService.keyFor(event)).asReadonly();
    }

    private bump(key: string): void {
        this.signalFor(key).update((n) => n + 1);
    }

    private signalFor(key: string): WritableSignal<number> {
        let existing = this.revisions.get(key);
        if (!existing) {
            existing = signal(0);
            this.revisions.set(key, existing);
        }
        return existing;
    }

    /** Model-scoped topics key on the model too, so one model's recompute can't wake every surface. */
    private static keyFor(event: SonarInvalidation): string {
        return event.topic === "models" ? "models" : `${event.topic}:${event.modelId}`;
    }
}
