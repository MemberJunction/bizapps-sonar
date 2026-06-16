import { Component, computed, output, signal } from "@angular/core";

/** One row of the publish gate. `na` = not applicable (e.g. ExpressionDriven-only check). */
type GateStatus = "pass" | "fail" | "na";
interface GateCheck { label: string; detail: string; status: GateStatus; }
/** A published immutable version — maps to ScoreModelVersion. */
interface ModelVersion { number: number; label: string; by: string; when: string; isCurrent: boolean; summary?: string; }

/**
 * Publish & Snapshot — visual scaffold for the publish gate + version history
 * (see plans/mockups/builder/snapshot.html). Hosted inside the Model Builder; emits `close`.
 *
 * SCAFFOLD: the gate checks + version list are sample data (signal-backed). The four checks
 * mirror ScoreModelEntityServer.ValidateAsync exactly. Publish is inert — when wired it runs
 * the "Sonar: Publish Model" Action (or Save hook) that snapshots an immutable ScoreModelVersion.
 */
@Component({
    standalone: false,
    selector: "sonar-publish-snapshot",
    templateUrl: "./sonar-publish-snapshot.component.html",
    styleUrls: ["../sonar-shell.css", "./sonar-publish-snapshot.component.css"],
})
export class SonarPublishSnapshotComponent {
    public readonly close = output<void>();

    public readonly modelName = signal("Renewal Risk");
    public readonly nextVersion = signal(4);
    public readonly changeSummary = signal("Added renewal-window silence factor; reweighted toward recency.");

    /** The publish gate — the same checks the server enforces, in plain language. */
    public readonly checks = signal<GateCheck[]>([
        { label: "At least one signal added", detail: "5 signals in this model", status: "pass" },
        { label: "A band set is chosen", detail: "Using “Default Health Bands”", status: "pass" },
        { label: "The band set has bands", detail: "3 bands set up", status: "pass" },
        { label: "Custom formula provided (only if you use one)", detail: "Not needed for this model", status: "na" },
    ]);

    /** Can publish when no check has failed (the server re-validates regardless). */
    public readonly canPublish = computed(() => this.checks().every((c) => c.status !== "fail"));

    /** What gets saved in the version snapshot, in plain terms. */
    public readonly snapshotParts = [
        { title: "Model setup", detail: "who it scores + how" },
        { title: "Data sources", detail: "5 connected" },
        { title: "Signals", detail: "5, with their weights" },
        { title: "Bands", detail: "3, with their ranges" },
    ];

    public readonly versions = signal<ModelVersion[]>([
        { number: 3, label: "renewal-window decay", by: "S. Patel", when: "Jun 9, 2026", isCurrent: true, summary: "Added event attendance weight; tuned penalty." },
        { number: 2, label: "added event attendance", by: "S. Patel", when: "May 2, 2026", isCurrent: false },
        { number: 1, label: "initial rubric", by: "D. Cho", when: "Apr 14, 2026", isCurrent: false },
    ]);
}
