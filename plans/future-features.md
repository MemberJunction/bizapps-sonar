# Future Features & Ideas

Ranked by value, each with the *why*, the shape of the work, and where it plugs in. Written at handoff (July 2026) so the reasoning survives, not just the list. Statuses: **next** (designed, start here), **designed** (thought through, not started), **idea** (worth exploring, not committed), **parked** (deliberately not now, with the reason).

The through-line: Sonar's selection went from "sort by score" to "shape + reason + member context + rank". What remains is making it answer the operator's *actual* question — "who's slipping AND about to renew, worth the call, capped at what my team can do this week" — and then closing the loop so the thresholds stop being guesses.

---

## 1. One-hop related-entity conditions — **next**

**The gap:** member conditions only see the anchor entity. The demo's own headline urgency field, `RenewalDate`, lives on `Membership` (one hop via `MemberID`), so "renews in 60 days" — the canonical urgency question — is inexpressible. Same for membership `Status`, `AutoRenew`, `MembershipType`.

**Shape:** extend `AnchorCondition` with an optional relation (entity + FK back to the anchor, resolved by Name through MJ metadata like everything else), compile to `EXISTS (SELECT 1 FROM related WHERE fk = anchor.ID AND <condition>)`. The same `validRankFields` treatment lets `rank.urgencyField` reach a related date, which finally makes the `soonest` and `priority` urgency term real (no demo anchor has a future-dated field).

**Cautions:** keep it ONE hop — arbitrary paths become a query builder, which is a different product. `ModelRelatedEntity` already declares related entities per model (`Alias`, `RelationshipPath`, `JoinType`) and is the natural place to scope which relations a rule may touch. Watch row multiplicity: a member with three memberships must not appear three times (EXISTS, not JOIN).

**Pointers:** `packages/Engine/src/orchestration/anchorConditions.ts` (the compiler and its "unknown field = error" stance), `SegmentEvaluator.applyAnchor`, `_validate_anchor_rank.mjs` for the verification pattern.

## 2. Close the loop: lift → thresholds — **designed**

**The gap:** every threshold (3 pts/month, 90 days, 3 cycles, priority weights 0.5/0.3/0.2) is a sensible guess. Sonar *measures* lift per intervention (`Sonar: Measure Intervention Outcomes`, treatment vs holdout) but nothing feeds results back into selection. This is also the honest answer to "is the selection good?" — currently unproven against reality.

**Shape (crawl → walk → run):**
- *Crawl:* show, on each preset chip, the measured lift of past interventions launched from that rule. Pure read; no behaviour change.
- *Walk:* a "calibration" panel comparing lift across rule variants that have actually run.
- *Run:* suggest threshold adjustments ("rules with `minDeclineRun: 2` outperformed `3` by X pp"). Suggest — never auto-apply; the governance stance everywhere else is human-approves.

**Pointers:** `OutcomeMeasurer` in the engine; `Intervention`/`InterventionAssignment` carry the segment's FilterJSON snapshot, so rules are attributable after the fact.

### 2b. Authoring agent learns the intervention layer — **designed, built once, deliberately backed out**

The agent's tool surface and system prompt are 100% authoring-side; it knows nothing about interventions.
A measurement-only version (tool #24 + a prompt section) was built and live-verified on 7 Aug 2026, then
removed the same day: the UI's Measure button already answers "did it work?" in one click, so agent
measurement is redundant *until this item (#2) exists* — the agent correlating measured lift with the
config it authors is when the capability earns its keep. The work is deliberately NOT in git history, so
this note is the record.

**The recipe, when it's time (all verified working once):**
- `AIAgentAction` link follows the `AAC70000-<action-slot>` id convention; the Measure action is slot
  `001C`. Seed via forward migration + PG twin + the `metadata/agents/.sonar-agent.json` mirror.
- Give the Measure action an `InterventionName` input resolved Find-Models-style (exact match first, then
  substring; an exact TIE among duplicate names stays ambiguous — never coin-flip a cohort). Ambiguous and
  unknown names should fail **with the candidates as structured data in `Result`**, and a bare call should
  SUCCEED with the intervention list, so discovery costs one round trip and no separate list tool.
- The success message must lead with **success lift + the outcome definition** (the product's headline),
  not score lift; "0 newly measured" on a re-run is an answer, not a failure; surface `writeFailures`.
- Prompt update = guarded `REPLACE` on the seeded `TemplateContent` (`094E9B12-…`), the
  `V202607211300` pattern, inserting above `## Rules`. Teach: measurement only; launching/drafting/
  sending are human-only, point at the Engagement page; how to read lift honestly. Both behaviours
  verified live through the copilot (measured by partial name in 12s; refused a send and redirected).
- **Trap, hit twice in two days:** the agent/prompt mirrors drift from the DB (Count Population's link
  was missing from the mirror; the dev DB was missing the July prompt patch). Diff mirror against DB
  before AND after; nothing checks this automatically.

## 3. Dormancy derived from source data — **designed**

**The gap:** `Member.LastActivityDate` is NULL for 1,949 of the 2,000 demo members (the other 51 are stamped by `demo-data/` for its cohort only), so dormancy conditions still match nobody real. The truth is in the factor source tables (6,851 event registrations, 6,806 payments, 123 of them demo-seeded).

**Shape:** a recompute-time write of max(activity dates across a model's factor sources) — either onto the Score row (new column, e.g. `LastSignalAt`) or a dedicated per-anchor rollup. Doing it in the engine keeps it consistent with what the score already reads and makes it portable to any host whose anchors have the same gap (likely many). NULL must keep meaning "unknown", never "never active".

**Pointers:** `ScoringEngine`/`ScoreWriter` (it already touches every member's source rows per recompute — the rollup is nearly free there).

## 4. OR / NOT / exclusions in rules — **designed**

**The gap:** everything ANDs. Can't say "sliding fast OR crossed a band", and — the operationally painful one — can't say "AND NOT contacted in the last 30 days", so overlapping plays will double-contact people.

**Shape:** two deliberately separate things. (a) A general boolean grammar over the existing layers — grouped OR at the top level is probably enough; full nesting is scope creep toward a query builder. (b) **Contact suppression** as a first-class filter term (`notTreatedWithinDays`), reading `InterventionAssignment` — this one is small, self-contained, and prevents real harm; do it first.

## 5. Multi-cause reasons — **idea**

**The gap:** `dominantDrag` picks exactly one cause; a member weak on three signals lands in one slice with one label. Clean groups, occasionally misleading labels.

**Shape:** `rankFactorDrag` already returns the full ranking — the data exists. Options: secondary-cause label on the member ("Low events, also low email"), or overlap counts on the breakdown ("136 · 41 also weak on email"). Resist multi-membership in slices: the breakdown's virtue is that slices partition (counts sum to the total, verified); overlapping slices break the mental model. Keep partition, add annotation.

## 6. Launch panel: play-declared params — **DONE** (shipped, verified)

Built exactly as designed and verified end to end (`ActionExecutionLog` shows operator-typed params reaching
the action): the panel renders whatever the chosen play declares — booleans as a switch, defaults as
placeholders, required params blocking launch. Any parameterised play works with zero client changes.
Kept here so nobody re-designs it.

## 7. Saved segments / named rules — **idea**

Rules are ephemeral UI state; a good one ("Q3 renewal risk") can't be saved, shared, or scheduled. `ScoreSegment` already persists FilterJSON server-side — this is mostly UI (save/load/list) plus the scheduling question. **Prereq:** fix the `TransitionInterventionDispatcher` trajectory bug first (HANDOFF gap #1), or scheduled trajectory rules silently fire on nobody.

## 8. Autonomy dial (Suggest → Approve → Auto) — **parked**

The Gainsight-style graduation: plays start human-approved and earn autonomy from measured lift. Parked because it's premature until #2 exists (autonomy should be *earned from evidence*, and there is no evidence loop yet) and the stakeholder positioning is outcomes-first simplicity. The approve-queue architecture (durable `InterventionProposal` rows, status transitions) was built with this in mind and won't need rework.

## 9. Automation rules ("if drops over 5, do X") — **parked, explicitly**

Raised once, then deliberately shelved by the owner: "the rule thing is just an idea currently, not exactly well defined… don't build on it." Anything here should start from a fresh product conversation, not from this doc.

---

## Smaller, worthwhile

- **Cross-surface control-language rollout** — the shared control primitives exist in `sonar-shell.css` but only engagement-manager uses them, and even it hand-rolls the launch panel's kind selector a few lines from the `.sonar-optlist` it should be. Other surfaces have bespoke domain widgets with their own active states. Write the pill-vs-optlist-vs-switch rule into `packages/Angular/CLAUDE.md` first, then convert in one pass. (See the HANDOFF fix-me list.)
- **`datetimeoffset` migration** for timestamp columns — **built in PR #45** (`feat(engine): convert Sonar timestamps to datetimeoffset`), green and mergeable at handoff. This supersedes the old in-code workaround (`finishRun` re-stamping from an in-memory Date); review and merge #45 rather than re-solving it.
- **Entity-picker scoping** — anchor/source pickers should offer business entities only, excluding `__mj*` schemas (deferred once already).
- **Changeset for the UI craft pass** — the control-language work has no changeset entry, so it's invisible to release notes.
- **Remote Operations conversions** — see [`remote-operations.md`](remote-operations.md). Its top candidate (intervention commit) is the code in PR #46, so it becomes actionable the moment #46 lands.
