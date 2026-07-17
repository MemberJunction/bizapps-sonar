import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, effect, inject } from "@angular/core";
import { MJConversationEntity } from "@memberjunction/core-entities";
import { SonarAssistantConversationService } from "./sonar-assistant-conversation.service";

/**
 * The Sonar copilot — a DOCKED, resizable, collapsible right-side panel (not a popup), mirroring how
 * Component Studio's builders dock their side panels. Dropped into each Sonar surface so the agent is
 * available everywhere without a dedicated nav tab. When collapsed it shows a thin reopen tab on the
 * right edge. Open/collapsed state, width, and the conversation all live in the shared
 * {@link SonarAssistantConversationService} singleton, so none is lost when a host surface re-renders
 * and recreates this launcher. See plans/agentic-authoring.md §4c.
 */
@Component({
    standalone: false,
    selector: "sonar-copilot-launcher",
    templateUrl: "./sonar-copilot-launcher.component.html",
    styleUrls: ["./sonar-copilot-launcher.component.css"],
})
export class SonarCopilotLauncherComponent implements AfterViewInit, OnDestroy {
    private readonly convo = inject(SonarAssistantConversationService);
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly zone = inject(NgZone);

    public readonly open = this.convo.open;
    public readonly width = this.convo.width;

    // Bindings for the embedded <mj-conversation-chat-area>.
    public readonly conversationId = this.convo.chatConversationId;
    public readonly agentId = this.convo.agentId;
    public readonly environmentId = this.convo.environmentId;
    public get currentUser() { return this.convo.currentUser; }

    constructor() {
        // effect() MUST be called inside an injection context (constructor or field init).
        // ngAfterViewInit is NOT an injection context in Angular 18+, so calling effect()
        // there throws and prevents the WebKit MutationObserver from being registered.
        effect(() => {
            const isOpen = this.open();
            const _cid = this.conversationId(); // track both signals
            if (isOpen) this.scheduleScrollSweep();
        }, { allowSignalWrites: false });
    }

    public toggle(): void {
        this.convo.open.update((v) => !v);
    }

    public close(): void {
        this.convo.open.set(false);
    }

    /** The chat created a new conversation — remember it so a reload resumes the same thread. */
    public onConversationCreated(e: { conversation: MJConversationEntity }): void {
        if (e?.conversation?.ID) this.convo.rememberChatConversation(e.conversation.ID);
    }

    // ---- Resize (drag the panel's left edge) ----
    // The panel is docked to the right, so its width = viewport width − cursor X. Bound handlers are
    // stored so the same references can be removed on mouseup (no leaked document listeners).
    private readonly onResizeMove = (e: MouseEvent): void => {
        this.convo.width.set(window.innerWidth - e.clientX);
    };
    private readonly onResizeEnd = (): void => {
        document.removeEventListener("mousemove", this.onResizeMove);
        document.removeEventListener("mouseup", this.onResizeEnd);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        this.convo.setWidth(this.convo.width()); // clamp + persist the final width
    };

    public onResizeStart(e: MouseEvent): void {
        e.preventDefault();
        document.addEventListener("mousemove", this.onResizeMove);
        document.addEventListener("mouseup", this.onResizeEnd);
        document.body.style.userSelect = "none"; // don't select text while dragging
        document.body.style.cursor = "col-resize";
    }

    // ---- Scroll-to-bottom on panel open ----
    // When the panel opens (or the conversation changes), the @if gate re-mounts
    // mj-conversation-chat-area. MJ's internal scrollToBottomNow() fires during
    // ngAfterViewChecked, but the flex dimensions may not be resolved yet on the
    // first paint — scrollHeight = 0 at that point, and the retry budget (10 × 50ms)
    // sometimes runs out before layout settles. We schedule an independent sweep that
    // targets both the chat-area scroll container AND the inner message-list container
    // so at least one lands after the layout is real.
    private scrollSweepId = 0;

    private scheduleScrollSweep(): void {
        if (this.scrollSweepId) { clearTimeout(this.scrollSweepId); }
        // 300ms: generous enough for flex to resolve on any device, short enough
        // that the user won't see the conversation at the wrong scroll position.
        this.scrollSweepId = window.setTimeout(() => {
            this.zone.runOutsideAngular(() => {
                const root = this.host.nativeElement;
                for (const sel of [".chat-messages-container", ".message-list-container"]) {
                    const el = root.querySelector<HTMLElement>(sel);
                    if (el && el.scrollHeight > el.clientHeight) {
                        el.scrollTop = el.scrollHeight;
                    }
                }
            });
            this.scrollSweepId = 0;
        }, 300);
    }

    // ---- Safari (WebKit) blank-message-list workaround ----
    // On agent init WebKit fails to rasterize the message list's SCROLLING-CONTENTS layer: the content
    // is present, visible, and uncovered (confirmed via devtools — opacity 1, thousands of px of laid-out
    // content, nothing overlaid) but paints white until a real scroll GESTURE forces a repaint. Neither
    // a programmatic scrollTop change nor a transform toggle rebuilds that scroll layer — but flipping
    // `overflow-y` off and back on does (verified in-browser: it's the exact layer a scroll gesture
    // rebuilds). Crucially the blank appears a variable delay AFTER the content paints ("flash, then
    // white") and then STAYS, so a single toggle on the mutation fires too early to help. Instead we
    // fire a short BURST of toggles after each content change, so one always lands after the drop
    // settles. Scoped to WebKit — on Chrome/Firefox there's no bug and no reason to pay the reflow.
    private repaintObserver?: MutationObserver;
    private rafId = 0;
    private burstId = 0;

    public ngAfterViewInit(): void {
        if (!this.isWebKit()) return; // Safari/iOS only — Blink/Gecko don't drop the scroll layer
        // Run outside Angular — this observer fires on every streamed token and must not trigger a
        // change-detection pass; it only nudges an inline style.
        this.zone.runOutsideAngular(() => {
            this.repaintObserver = new MutationObserver(() => this.scheduleRepaint());
            this.repaintObserver.observe(this.host.nativeElement, { childList: true, subtree: true });
        });
    }

    public ngOnDestroy(): void {
        this.repaintObserver?.disconnect();
        cancelAnimationFrame(this.rafId);
        this.stopBurst();
        if (this.scrollSweepId) { clearTimeout(this.scrollSweepId); }
    }

    /** WebKit (Safari desktop + iOS, incl. iOS Chrome) but not Blink (Chrome/Edge) or Gecko. */
    private isWebKit(): boolean {
        const ua = navigator.userAgent;
        return /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg\//.test(ua);
    }

    /** On each content change, (re)start a bounded burst of re-rasters over ~2s. The blank lands a
     *  variable moment after paint and stays, so we keep toggling until one lands after the drop.
     *  Any new content (streamed token, overlay dismiss) restarts the window. */
    private scheduleRepaint(): void {
        const el = this.host.nativeElement.querySelector<HTMLElement>(".chat-messages-container");
        if (!el) return;
        this.stopBurst();
        cancelAnimationFrame(this.rafId);
        this.rafId = requestAnimationFrame(() => this.forceRaster(el)); // after this paint
        let ticks = 0;
        this.burstId = window.setInterval(() => {
            this.forceRaster(el);
            if (++ticks >= 14) this.stopBurst(); // ~14 × 150ms ≈ 2.1s after the last change
        }, 150);
    }

    private stopBurst(): void {
        if (this.burstId) { clearInterval(this.burstId); this.burstId = 0; }
    }

    /** Flip overflow off and back on to make WebKit tear down and rebuild the scroll container's
     *  scrolling-contents layer, forcing it to rasterize the present-but-unpainted content. The
     *  synchronous reflow (reading offsetHeight) between the two writes is what triggers the rebuild;
     *  restoring the prior inline value hands styling back to the stylesheet. (macOS uses overlay
     *  scrollbars, so toggling overflow doesn't shift layout — no visible flicker.) */
    private forceRaster(el: HTMLElement): void {
        const savedTop = el.scrollTop;
        const prev = el.style.overflowY;
        el.style.overflowY = "hidden";
        void el.offsetHeight; // force WebKit to tear down + rebuild the scroll layer
        el.style.overflowY = prev;
        // Safari clamps scrollTop to 0 when overflow goes hidden; restore it.
        el.scrollTop = savedTop;
    }
}
