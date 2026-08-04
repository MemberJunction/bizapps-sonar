---
"@mj-biz-apps/sonar-engine": minor
"@mj-biz-apps/sonar-actions": minor
"@mj-biz-apps/sonar-ng": minor
---

Make `Kind='BulkSync'` real: hand the treated cohort to a play in one batch, starting with MJ Lists.

An intervention's job is to facilitate the data an action needs — who to act on and why — whether the acting happens inside MJ or in an external system. `BulkSync` (reserved by the Kind migration) is now the third launch option: instead of firing a play once per treated member, the runner fires it ONCE with the whole treated cohort as a runner-injected `CohortJSON` payload (plus `ModelID`/`InterventionID`; same-named operator params are dropped so a play can never receive a spoofed cohort). No new config machinery — a "sync target" is just a play in the picker, so an external push later is another batch action, not a schema change.

Two deliberate asymmetries vs the per-member path:

- **Control members are never in the payload.** The play delivers the cohort to wherever acting happens; leaking the held-back members there would contaminate the comparison group and void the lift measurement.
- **A failed batch writes no assignments.** Per-member fires record `Failed` per member because the other sends already happened; a single batch call failing means *nothing* happened, so burning idempotency on it would strand the whole cohort un-retryable. No rows → the next commit retries cleanly.

The first bulk play is `Sonar: Sync Cohort To List` — it lands the cohort on an MJ **List**, the one target the platform can already act on today: staff work it in the Lists app row-by-row via `ListDetail.Status`, it's shareable (`Share List` / `Invite To List`), and a connector can bind to it (`List.CompanyIntegrationID`). Each row carries the member's score/band/intervention in `AdditionalData`, so whoever works the list sees why each name is there. The list is found-or-created by name and re-syncs skip records already on it, so a re-run only appends new entrants. This is also the MJ-native replacement for the in-Sonar worklist that the Kind refactor deleted: rather than Sonar owning a small CRM, the cohort goes to MJ's.

Launch panel gains the third kind ("Sync cohort"), the play picker now shows for both Action and BulkSync, and counts read per kind ("Would sync N", "Synced N"). Ships with the seeding migration in both dialects (`Sonar Plays` category re-guarded for installs that skipped the worklist migration).
