import { Component, Input, inject } from "@angular/core";
import { FormQuestion, ResponseForm, SonarAssistantConversationService } from "./sonar-assistant-conversation.service";

/**
 * Copilot panel for the Sonar Authoring Agent — a thin VIEW over
 * {@link SonarAssistantConversationService}. All conversation state (transcript, in-flight run,
 * oversight feed) lives in that app-scoped singleton, so the panel rehydrates instantly when it's
 * re-created. The agent produces DRAFTS only, surfaces every action as a visible oversight feed, and
 * may attach a structured FORM (choices/confirmation) to a turn — this component renders that form and
 * sends the answers back as the next message. `contextNote` lets a host inject what the user is viewing.
 * See plans/agentic-authoring.md §4c.
 */
@Component({
    standalone: false,
    selector: "sonar-assistant-panel",
    templateUrl: "./sonar-assistant-panel.component.html",
    styleUrls: ["./sonar-assistant-panel.component.css"],
})
export class SonarAssistantPanelComponent {
    /** Public so the template binds straight to the shared signals (turns/running/liveSteps/errorMsg). */
    public readonly convo = inject(SonarAssistantConversationService);

    /** Optional context the host injects, prepended to the first user message. */
    @Input() public contextNote: string | null = null;

    public prompt = "";

    /** Form state lives in the shared service (survives panel re-render). Local aliases for brevity. */
    private get selections() { return this.convo.formSelections; }
    private get submitted() { return this.convo.submittedForms; }

    public send(): void {
        const text = this.prompt.trim();
        if (!text || this.convo.running()) return;
        this.prompt = "";
        void this.convo.send(text, this.contextNote);
    }

    /** Enter sends; Shift+Enter is a newline. */
    public onKeydown(e: KeyboardEvent): void {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            this.send();
        }
    }

    // ---- Response form ----

    private key(turnIndex: number, questionId: string): string {
        return `${turnIndex}:${questionId}`;
    }

    public isChosen(turnIndex: number, questionId: string, value: string): boolean {
        return (this.selections()[this.key(turnIndex, questionId)] ?? []).includes(value);
    }

    /** Toggle a choice option. `multiple` → add/remove from the set; single → replace. */
    public choose(turnIndex: number, q: FormQuestion, value: string): void {
        if (this.isSubmitted(turnIndex)) return;
        const k = this.key(turnIndex, q.id);
        const multiple = q.type.type === "checkbox" && q.type.multiple === true;
        this.selections.update((s) => {
            const current = s[k] ?? [];
            const next = multiple
                ? current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
                : [value];
            return { ...s, [k]: next };
        });
    }

    public textValue(turnIndex: number, questionId: string): string {
        return (this.selections()[this.key(turnIndex, questionId)] ?? [])[0] ?? "";
    }

    public setText(turnIndex: number, questionId: string, value: string): void {
        const k = this.key(turnIndex, questionId);
        this.selections.update((s) => ({ ...s, [k]: value ? [value] : [] }));
    }

    public isChoice(q: FormQuestion): boolean {
        return ["checkbox", "radio", "buttongroup", "dropdown"].includes(q.type.type);
    }

    public isSubmitted(turnIndex: number): boolean {
        return this.submitted()[turnIndex] === true;
    }

    /** True once every required question has an answer. */
    public canSubmit(turnIndex: number, form: ResponseForm): boolean {
        if (this.isSubmitted(turnIndex) || this.convo.running()) return false;
        return form.questions.every((q) => !q.required || (this.selections()[this.key(turnIndex, q.id)] ?? []).length > 0);
    }

    /** Compose the answers into a plain-language message and send it back to the agent. */
    public submitForm(turnIndex: number, form: ResponseForm): void {
        if (!this.canSubmit(turnIndex, form)) return;
        const parts = form.questions
            .map((q) => {
                const chosen = this.selections()[this.key(turnIndex, q.id)] ?? [];
                if (!chosen.length) return null;
                const labels = this.isChoice(q) ? chosen.map((v) => this.optionLabel(q, v)) : chosen;
                return `${q.label}: ${labels.join(", ")}`;
            })
            .filter((p): p is string => p !== null);
        if (!parts.length) return;

        this.submitted.update((s) => ({ ...s, [turnIndex]: true }));
        const lead = form.submitLabel ? `${form.submitLabel} — ` : "";
        void this.convo.send(`${lead}${parts.join("; ")}.`, this.contextNote);
    }

    /** Map a chosen option value back to its human label for the outgoing message. */
    private optionLabel(q: FormQuestion, value: string): string {
        return (q.type.options ?? []).find((o) => String(o.value) === value)?.label ?? value;
    }
}
