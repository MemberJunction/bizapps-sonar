---
"@mj-biz-apps/sonar-ng": minor
---

Signal Studio surface.

`SonarSignalStudioResource` — the Codesmith signal-authoring surface: describe a scoring signal in plain language, an agent writes the code, and you review / test / approve it before it can bind to a model. Shows the authoring pipeline (in-flight, for-review, library) and a commission panel with starter templates.

Self-contained — no new dependencies (its imports were already declared for the other surfaces) and no shared-primitive usage. Declared in `CustomFormsModule`. Adds the **Signals** nav entry to the application metadata, which lights up the previously-dead nav item (the `SonarSignalStudioResource` not-registered console error is now resolved).
