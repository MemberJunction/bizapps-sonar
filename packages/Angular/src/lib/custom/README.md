# Sonar custom Angular code

Hand-written Sonar UI (the generated forms live in `../generated`). Organized by the
**Core-Shared-Feature** convention so each business surface is self-contained and the
dependency direction is one-way: `features → shared → core` (never the reverse).

```
custom/
├── core/
│   └── services/          # singleton, app-wide data services (providedIn:'root')
│                          #   current-model · score-model · factor · score-band
│                          #   score-read · sonar-engine
├── shared/                # reusable, business-agnostic building blocks
│   ├── styles/            #   sonar-shell.css — the shared design system / primitives
│   ├── model-sidebar/     #   the model rail (primary navigation)
│   └── multiselect/       #   combobox + chips multi-select
├── features/              # self-contained surfaces (one folder per domain)
│   ├── overview/          #   single-model dashboard
│   ├── model-builder/     #   authoring surface
│   │   └── builders/      #     modals hosted only by Model Builder
│   │       ├── model-setup/
│   │       ├── factor-builder/
│   │       ├── score-band-builder/
│   │       └── publish-snapshot/
│   ├── engagement-manager/#   triage list + explainability drawer
│   └── admin-ops/         #   operations surface
└── custom-forms.module.ts # declares every component (module-declared pattern)
```

## Conventions

- **Dependency direction:** `features` may import from `shared` and `core`; `shared` may
  import from `core`; **`core` and `shared` never import from `features`.** Builders that
  only one feature uses live inside that feature (e.g. Model Builder's `builders/`), not in
  `shared`.
- **Services are app-wide singletons** (`providedIn:'root'`) and live in `core/services`
  because each is consumed by more than one feature. A service used by exactly one feature
  would instead live under that feature.
- **Surfaces register via `@RegisterClass(BaseResourceComponent, '…')`** and are reached
  through an MJExplorer nav `DriverClass` — there is no Angular router here, so feature
  folders are declared in the NgModule rather than lazy-loaded as routes.
- **Styling:** components use emulated view encapsulation, so each one lists
  `shared/styles/sonar-shell.css` in its `styleUrls` to pick up the shared primitives,
  alongside its own component stylesheet.
