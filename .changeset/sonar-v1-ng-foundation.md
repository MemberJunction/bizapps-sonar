---
"@mj-biz-apps/sonar-ng": minor
---

Angular foundation + first two UI surfaces (Overview, Model Builder).

**Foundation**
- **core/services** — app-wide singletons (`providedIn: 'root'`): score model / factor / band / read services, the current-model store, engine + factor-smith services, action catalog, toast, plus CSV / anchor-name / action-result utilities and the entity-graph helper.
- **shared/** — reusable, business-agnostic primitives (all `standalone: false`): the filter bar (`sonar-filter-bar` + search / range / toggle controls), the model sidebar rail, and the multiselect (chips over `<mj-combobox>`).
- **shared/styles/sonar-shell.css** — the shared stylesheet, anchored to MJ's `--mj-*` theme tokens with the local `--sonar-*` accent/band tokens (native light/dark compliance).

**Surfaces**
- **Overview** (`SonarOverviewResource`) — band distribution, trend, movers, attention items.
- **Model Builder** (`SonarModelBuilderResource`) with its hosted builders — model setup, factor builder (+ prompt editor), score-band builder, publish snapshot, version history — opened via in-feature view switching. Uses `<mj-filter-builder>` for the population filter.

`CustomFormsModule` is the single coordination point; this PR declares the shared primitives + these two surfaces. Engagement, Admin, Signal Studio, and the Copilot launcher land in the next UI PR — the copilot embed is stubbed out in these two templates until then. Nav entries for both surfaces already exist in the application metadata.
