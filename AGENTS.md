# AGENTS.md — Sonar Agent Engineering Guide

This repository (`MemberJunction/bizapps-sonar`) is the **Sonar** MemberJunction Open App (`__mj_BizAppsSonar` schema). Read [`CLAUDE.md`](CLAUDE.md) for the full project rules, domain conventions, release flow, and UI rules ([`packages/Angular/CLAUDE.md`](packages/Angular/CLAUDE.md)).

## Package Tiers & Client/Server Boundary

| Package | Tier (`mj-app.json`) | Responsibility |
|---|---|---|
| `@mj-biz-apps/sonar-entities` | `shared` (browser + server) | Generated entity subclasses (`src/generated/`) + `SonarEngineBase` (`src/engine/SonarEngineBase.ts`) |
| `@mj-biz-apps/sonar-ng` | `client` (browser) | Angular surfaces, services, and shared UI primitives |
| `@mj-biz-apps/sonar-engine` | `server` | ScoringEngine, FactorCompiler, NormalizationEngine, RecomputeOrchestrator, ScorePersister |
| `@mj-biz-apps/sonar-actions` | `server` | Hand-authored & generated MJ Actions |
| `@mj-biz-apps/sonar-core-entities-server` | `server` | Server-side entity lifecycle guards & publish snapshots |
| `@mj-biz-apps/sonar-server` | `server` | GraphQL resolvers & server bootstrap |

- **NEVER** import `sonar-engine`, `sonar-actions`, `sonar-core-entities-server`, or `sonar-server` from `sonar-ng` or `sonar-entities`. Verify with `./.github/scripts/validate-client-package-boundary.sh`.
- **ZERO `any` or lazy `unknown`**, **ZERO `.Get()`/`.Set()`**, **ZERO cross-package re-exports**, **`BaseSingleton` for all singletons**, and **`@if`/`@for`/`@switch` + `inject()`** in Angular.
- **NEVER** hand-edit `src/generated/` or `ci/` protected files.

## 5-Rule BizApps Performance & Caching Standard

All coding agents modifying data access, services, actions, or Angular surfaces in Sonar MUST follow these five rules:

1. **`BaseEngine` (`SonarEngineBase`) for bounded taxonomy & configuration metadata**
   - Use `await SonarEngineBase.Instance.Config(false, contextUser, provider)` for `Score Models`, `Score Band Sets`, `Score Bands`, `Time Windows`, `Model Related Entities`, `Factors`, and `Model Factors`.
   - Use its O(1) lookup helpers (`GetModelById`, `GetModelByName`, `GetActiveModels`, `GetBandSetById`, `GetBandsForBandSet`, `GetBandMapForBandIds`, `GetTimeWindowById`, `GetRelatedEntitiesForModel`, `GetFactorById`, `GetModelFactorsForModel`, `GetSignalCountsByModel`) and reactive `ObserveProperty` streams (`ScoreModels$`, `ScoreBands$`, `Factors$`, etc.).
   - **NEVER** bulk-cache unbounded runtime/audit/snapshot tables (`Scores`, `Score Factor Contributions`, `Score Histories`, `Score Band Transitions`, `Score Recompute Runs`, `Score Model Audit Events`, `Score Model Versions`).

2. **Multi-provider / impersonation / RLS `CacheLocal` safety**
   - Always override `ProviderToUse` to track explicit providers (`this._activeProvider ?? super.ProviderToUse`), pass `provider` unchanged to `super.Load(...)` (never hardcode `Metadata.Provider`), and force-refresh on provider or client-user switches.
   - `CacheLocal: true` ONLY for global non-RLS config tables; ALWAYS `CacheLocal: false` for any RLS-protected or user-scoped entity.
   - Gate entity loads on metadata presence and `GetUserPermisions(user)?.CanRead`.

3. **`rv.RunViews([...])` batching + `ResultType: 'simple'` + `Fields`**
   - Never run `Promise.all([new RunView().RunView(...), ...])` or sequential independent `await rv.RunView(...)` calls; combine them into ONE `rv.RunViews([...])` batch (`RunView.FromMetadataProvider(this.ProviderToUse)` when a provider is in scope).
   - Never call `RunView` inside a loop; collect IDs/queries and issue one `rv.RunViews([...])` call.
   - Default to `ResultType: 'simple'` + explicit `Fields` for all read-only queries; reserve `ResultType: 'entity_object'` for rows that will be mutated and saved/deleted.

4. **Bounded per-container caches vs. NEVER caching arbitrary filtered lists**
   - Only use `ConversationEngine`-style bounded per-container caches keyed by `(containerId, viewerUserId)` and invalidated on `BaseEntity` save/delete events + user/provider switches.
   - Never cache arbitrary filtered, searched, or paginated query results.

5. **RLS-safe two-step entity reads (zero raw SQL subqueries)**
   - Never inject `IN (SELECT ID FROM [schema].[Table] ...)` subqueries into `RunView.ExtraFilter`.
   - Perform a first-class `RunView` on the scoping/parent entity, then load children via chunked `ParentID IN (...)` queries batched in `rv.RunViews([...])`.

## Verification Commands

```bash
pnpm run build:packages
pnpm test
./.github/scripts/validate-client-package-boundary.sh
node .github/scripts/check-caret-pins.mjs
node .github/scripts/check-dependency-model.mjs
```
