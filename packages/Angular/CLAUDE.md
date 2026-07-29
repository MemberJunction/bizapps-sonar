# UI/UX Engineering Standard & Project Map

This file governs how you build and modify any user-facing UI in this project. The bar is enterprise-grade, top-tier product polish (matching high-end Angular engineering systems like Taiga UI or clarity-driven design systems like Linear and Stripe). Two qualities define the work: **CONSISTENCY** (system-level) and **CRAFT** (pixel-level). When a view feels "off," your instinct must be to **REMOVE** something, not add it.

## 0. Project Environment & Sanctioned Design Tokens

- **Framework Details:** MemberJunction Open App on Angular 21. Components are NgModule-declared (`standalone:false`) in `custom/custom-forms.module.ts` using emulated encapsulation and modern `@if`/`@for` template syntax.
- **Style Location:** `bizapps-sonar/packages/Angular/src/lib/custom/shared/styles/sonar-shell.css`
- **Theming Rule:** Neutrals are anchored directly to MJ’s global `--mj-*` theme tokens via the local `:host` block. Do not style backgrounds, surfaces, or text inputs from memory. This preserves native light/dark mode compliance out of the box.
- **Accent Color Identity (Violet):** Chosen explicitly to sit distinctly on MJ's navy base and clean of data colors.
    - Light Mode: `--sonar-accent` = `#6d5fe0`
    - Dark Mode: `--sonar-accent` = `#8b5cf6` (nested inside the `:host-context([data-theme="dark"])` block)
- **Text on Saturated Fills:** MJ has no default token for this. You must strictly use fixed local tokens: `--sonar-on-accent`, `--sonar-on-band`, or `--sonar-hero-ink` (near-white) so text doesn't vanish when theme flags flip.
- **Bands Palette:** Refined, theme-aware muted jewel tones (healthy/watch/atrisk/critical) defined inside `sonar-shell.css`. Do not pull the raw, vibrating MJ status-500 tokens.
- **Spacing Scale:** Every single padding, gap, and margin must strictly map to: `0.25rem` / `0.5rem` / `0.75rem` / `1rem` / `1.5rem` / `2rem` (4/8/12/16/24/32px). Large section gaps use `2.5rem` / `3rem`.

---

## 1. Shared Primitives First (`custom/shared/`)

System-level consistency beats any single beautiful component. Before building a page, check for these existing primitives. If they exist, **USE THEM**. Never re-implement.

- **Global Primitives:** Layout styling classes for `.sonar-card`, `.sonar-stat`, `.sonar-chip`, `.sonar-btn`, `.sonar-input`, `.sonar-empty`, and `.sonar-skeleton`.
- **Filters:** There is exactly **ONE** `FilterBarComponent`. Every filterable view passes a configuration object to it. No page builds unique, inline filter layouts.
- **Visualization Atoms:** `.sonar-delta` (signed trend pill), `.sonar-movers`/`.sonar-mover` (insight feed), `.sonar-spark` (history sparkline), and `.sonar-trendline` (single-series line with gridlines).

---

## 2. Layout, Information Density & Contrast Mechanics

- **Horizontal Alignment Law:** Prioritize left-to-right horizontal flow over vertical stacking for control structures. Row grouping layout format: `[Primary Identity/Labels (Far Left)]` -> `[Interactive Sliders/Inputs (Center-Right, max-width: 240px)]` -> `[Status Metrics/Action Buttons (Far Right)]`. Eliminate unnecessary padding inside cards.
- **Responsive Narrow-Width Fallback:** When a horizontal row container's layout space drops below a stable threshold (or on narrow screen viewports), the horizontal alignment layout must cleanly drop its row structure and wrap into a stacked column grid (`flex-direction: column` or `grid-template-columns: 1fr`), expanding interactive inputs to full-width targets to avoid layout jamming.
- **Typography & Contrast Floors:** Establish strong hierarchy by scaling the contrast gap between elements. However, secondary labels, metadata, and muted text tokens must never drop below a hard **WCAG AA contrast ratio floor** (minimum 4.5:1 ratio against their background surface, or 3:1 for large typography/borders) to preserve legibility in both light and dark mode scales.
- **Data Displays:** Numbers must be right-aligned using tabular figures (`font-variant-numeric: tabular-nums`) so digits cleanly stack vertically. Left-align standard text strings. Table views use thin hairline row dividers or faint zebra striping—never full grid border structures.
- **Layout Adaptability:** Do not write rigid columns or fixed structural widths. Use `flex-wrap` and CSS Grid `auto-fit` setups so elements degrade cleanly from 1440px desktop widths down to 1075px layout rails (`.sonar-with-rail`).

---

## 3. Multi-Modal Affordance & Friction Rules

- **In-Context Editing:** Avoid throwing full-screen modals or adding floating, isolated "Edit" buttons if modifications can be handled inline. Clicking directly on an editable value, row, or display item must transform it instantly into its input field state or open an absolute-positioned floating popover/tooltip right next to the trigger.
- **Omni-Channel Affordance Signals:** Interactive or editable elements must explicitly broadcast their state across all form inputs:
    - _Mouse/Hover:_ Transition gracefully (`120-150ms`), swap cursor to `pointer`, and apply an ultra-subtle 5% background hue overlay.
    - _Keyboard/Focus:_ Implement an intentional, high-visibility focus ring via CSS `:focus-visible` that mirrors the hover weight, ensuring keyboard-navigated discovery is structurally equal to mouse tracking.
    - _Touch/Mobile:_ Elements that support direct interaction must display a permanent, subtle structural marker (such as a fine, low-opacity dashed bottom underline) so touch users can safely identify editable fields without hover states.
- **Single-Click Focus Management:** When an edit view toggles or a popover opens, programmatically call `.focus()` and `.select()` on the target input element instantly. The user must be able to type or overwrite numbers immediately without clicking a second time to highlight content.

---

## 4. Framework-Native State & Error Pipelines

- **Framework-Native State:** Rely on Angular's native change detection and two-way template data binding (`[(ngModel)]` or Reactive Form controls) to drive immediate local view updates (e.g., updating dependent charts instantly when a slider moves) rather than maintaining complex, manual frontend state caches.
- **Async Feedback & Save Locks:** Never freeze the viewport or block the screen layout with full-viewport loading spinners during database writes. When an async operation fires, temporarily shift _only_ the specific target element or save action button into a loading or disabled state to block data spamming while keeping the rest of the application fully interactive.
- **Graceful Failure Handling:** If a background network save fails, the application must immediately unlock the disabled trigger element, return it to its editable state, apply a clear visual error boundary (such as a semantic red border highlight or status outline), and throw a targeted, clear non-blocking alert notification detailing the sync failure so the user can retry.
- **Keyboard Defaults:** Do not write brittle, custom window key listeners that fight default browser actions or break routing scopes. Leverage native framework autofocus directives, HTML form `accesskey` properties, and structural forms that support natural `Enter` key submission flows.

---

## 5. Reference Matching Architecture

When matching design layouts against a provided reference image, prioritize copying the **CRAFT and HIERARCHY**, not the visual skin or color tokens:

- Keep exactly **ONE** distinct hero card or metric element highly dominant on the viewport; let all surrounding secondary modules recede.
- Ensure spacing patterns, corner radii, and drop shadows are perfectly uniform across all sibling containers.
- Match the clean ratio of structural calm—use generous whitespace and clear alignment rules to establish a premium look before reaching for decorative details.

---

## 6. Mandatory Visual Verification Loop (Playwright)

You cannot accurately evaluate user interfaces without looking at them. After completing any UI task, you must close this loop before submitting code. Work one screen at a time.

1. **DIAGNOSE:** Render the target interface via Playwright and take snapshots in **BOTH** light and dark modes (trigger dark mode natively or toggle via `document.documentElement.setAttribute('data-theme', 'light')`). Explicitly list all alignment, spacing, typographic contrast, or text-clipping flaws.
2. **FIX:** Directly overhaul the layout, variables, and styling classes to address the feedback. Do not write small, conservative patches just to preserve legacy layout bugs.
3. **VERIFY:** Re-run the snapshots across both themes. Ensure the layout handles beautifully at both 1440px and squeezed 1075px viewports.
4. **ACCEPTANCE GATE:** The task is only complete when:
    - **The Squint Test Passes:** Blurring the view maps obvious visual weight to critical anchors; it doesn't look like a flat field of identical text.
    - **Accent Rations Hold:** The violet accent appears in at most two spots across the viewport to guide user focus.
    - **Table Integrity is Intact:** Numeric metrics stack cleanly, use tabular spacing, and display values humanely (e.g., "4h 58m" instead of messy raw seconds).

---

## 7. Pre-Execution Handshake Protocol

Before writing or modifying any layout code, you must explicitly state to the user in this exact order:

1. Which shared primitives this specific engineering task requires, which already exist, and which new ones you intend to build inside the shared folder.
2. Confirm you have verified the sanctioned design tokens inside `sonar-shell.css` and will not use hardcoded hex variables.
