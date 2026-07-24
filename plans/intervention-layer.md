# Intervention Layer v1 — "Sonar decides, MJ executes, Sonar measures"

> Branch: `sonar_intervention_layer`. Supersedes the earlier build plan in this file (its CP1–CP4
> shipped: schema, engine loop, triggers, outcomes/lift, movers explorer, worklist play — that
> worklist tooling is now scheduled for REMOVAL per this re-anchoring; see git history for the old
> plan). Design source: [plan.md](plan.md) §2.1(3) ("scoring *and acting* in v1 — a score that
> nobody acts on is a thermometer"), §2.2 Wedge 5, §5.6, §7.5, §8 (Intervention Drafter agent).

## The thesis (re-anchored)

Sonar owns three things: **who/why/when** (segments, causes, triggers), the **holdout**, and the
**measured lift**. It never builds execution machinery. Every act is an **MJ Action** (a "play")
that composes MJ's existing fabric — Tasks, Notifications, AI Prompts, Communication, Integrations.
Human-gated modes ship first (route, draft-for-review) so trust is earned before anything touches a
member directly; full automation is a config flip later, not a rebuild.

Two positions this deliberately rejects:
- **"Just be the measurement layer / export a CSV."** That's the incumbent posture the plan names
  ("ship a number on a dashboard and leave the 'so what' to an overloaded human"). The act layer is
  the product — it's in every pricing tier and carries the performance component.
- **"Build the outreach tooling in Sonar."** The mini-CRM trap. Sonar composes MJ's substrate; it
  does not own task UIs, senders, schedulers, or contact-state machines.

## 1. Data model correction: `Kind`

Today every intervention requires an `ActionID`, which forced a fake no-op action for the worklist.
Fix with a discriminator:

```
Intervention.Kind      : 'Action' | 'TrackOnly'    -- v1 ('BulkSync' reserved for the write-back phase)
Intervention.ActionID  : NULLable                  -- required iff Kind='Action'
```

| Kind | Meaning | Fires anything? |
|---|---|---|
| **Action** | fire a *play* (an MJ Action) once per treated member | yes — the play |
| **TrackOnly** | the treatment happens in the real world (an external campaign, a staff push); Sonar only splits treatment/control and measures | no — pure experiment |

What disappeared: **"Worklist" is not a kind.** "Give staff a list to work" is a *play*
(`Route to Staffer`) that lands in MJ's own task/notification system. The Sonar-internal
To-do/Contacted/Done state machine is REMOVED (mini-CRM creep, and off-plan).

**Measurement stance (both kinds): intent-to-treat.** Everyone *assigned* to treatment counts as
treated, whether or not a staffer actually reached them. Statistically honest, and it's what makes
"MJ executes / Sonar measures" legitimate without Sonar tracking contact state.

## 2. The play contract (standard shape)

A play is an MJ Action conforming to `SonarInterventionPlay` — same pattern as `SonarFactorAction`
for signals:

```
Base class handles:  AnchorRecordID in → load member context (name, score, band,
                     dominant cause, factor detail) → deliver(ctx, params)
                     → standard { ok, detail } out

Contract declares:   label, description
                     sideEffect   : 'internal' | 'staff-facing' | 'member-facing'
                     autoFireable : boolean    -- safe for OnEnterSegment/delta without a human?
                     params       : [...]      -- renders the launch panel's config inputs
```

Governance keys off the **contract**, not heuristics:
- `internal` / `staff-facing` → may auto-fire (worst case: a staffer gets a task).
- `member-facing` → **never auto-fires in v1**; requires the approval gate and, for real sends,
  test-mode + recipient allowlist.
- The existing fire-time gate (generated `Runtime` code must be `CodeApprovalStatus='Approved'`)
  stays as a second, independent check.
- The launch picker lists only contract-conforming plays in the **Sonar Plays** category (built).

## 3. The v1 play library (the testable actions)

Ordered by trust level. Each is small because it composes MJ features.

### Play 1 — `Sonar: Notify Owner` · staff-facing · auto-fireable
- **Does:** one MJ **User Notification** per run to a configured staffer: "6 members entered
  At-Risk (renewal window) — mostly Low Payments." Cohort-level, not per member.
- **Leverages:** `MJ: User Notifications` (the bell staff already watch).
- **Why first:** cheapest real artifact, zero member risk, and the attention hook for every other play.
- **Test:** fire on a cohort → exactly one notification row for the target user with the correct
  cohort summary; renders in the bell.

### Play 2 — `Sonar: Route to Staffer` · staff-facing · auto-fireable
- **Does:** per treated member, an MJ **Task** — "Follow up: Maria Chen · At Risk · cause: cert
  lapsed (−22)" — assigned to a configured user, due +N days, cause context in the description.
  Pairs with a Notify Owner so the assignee's bell announces the batch.
- **Leverages:** `MJ: Tasks` + Notifications.
- **Known tension:** the team doesn't currently live in MJ Tasks. Answer: (a) the notification is
  the entry point — the task is durable state behind a bell-tap; (b) this is a *library* — orgs
  that live in tasks pick this play, others don't. Cost is low because MJ Tasks already exists.
- **Test:** launch on 10 members at 20% holdout → ~8 Task rows with correct names/causes/assignee,
  0 for control; re-launch → no duplicate tasks (idempotency).

### Play 3 — `Sonar: Draft Outreach` · staff-facing artifact · auto-fireable (output is a draft)
- **Does:** per treated member, runs an MJ **AI Prompt** with the member's context (band,
  trajectory, dominant cause, factor detail) to generate a personalized re-engagement message,
  attached to a Task for a human to review and send from their own client. Sonar delivers nothing.
- **Leverages:** MJ AI Prompts/Templates (the stack the signal engine already calls) + Tasks.
- **Why it matters:** the plan's "draft the outreach" verb — the first genuinely agentic act,
  inherently human-gated because the output is a draft.
- **Test:** fire on 3 members with different dominant causes → 3 drafts, each referencing THAT
  member's cause (cert-lapsed draft mentions certification; email-decay draft doesn't); prompt
  failure → assignment recorded with Failed delivery, run continues.

### Play 4 — `Sonar: Send Email` · member-facing · NOT auto-fireable · stretch/gated
- **Does:** actually delivers via the MJ **Communication** framework.
- **Guardrails required before this exists:** provider configured; **test-mode** (route all sends
  to a safe recipient) on by default; recipient **allowlist**; approval + explicit "arm live
  sending" step; per-run cap already exists.
- **Scope:** designed now, built only when a deployment has a configured provider and asks for it.
  v1 ships without it; Draft Outreach covers the content need human-gated.

### Kind 2 — `TrackOnly` (no play)
- **Does:** assignment split + measurement only. Use: "does the new onboarding flow work?" —
  run the campaign externally, let Sonar hold out and score it.
- **Test:** create TrackOnly intervention → commit → assignments written, NOTHING fired anywhere;
  simulate outcome movement → Measure → lift computed by intent-to-treat.

## 4. Guardrails (cross-cutting)

Already built: preview-before-commit; per-run cap; per-member idempotency; deterministic auditable
holdout; Treatment-only firing; failure isolation (a broken play never fails a recompute);
fire-time approval gate; play picker restricted to Sonar Plays.

Added by this plan:
- **Contract-driven gating** (side-effect class replaces the Type heuristic as the primary signal).
- **Contamination guard:** control members are visibly marked ("holdout — do not contact") wherever
  cohorts render, and are excluded from routed tasks/drafts/audiences by construction. In small
  orgs a well-meaning staffer contacting the control is the #1 way lift silently becomes fiction.
- Explicit **intent-to-treat** framing in the lift readout.

Deferred (named, not forgotten): global per-member contact ceiling across plays; lifetime budget
per intervention; live-send arming flow (with Play 4).

## 5. How every part fits (the loop, end to end)

```
recompute (engine)
  └─ writes Scores + ScoreBandTransitions + Deltas
       ├─ AUTONOMOUS: dispatcher fires Active OnEnterSegment/delta interventions
       │     └─ only plays with autoFireable + approved contracts
       └─ HUMAN: Engagement Manager (triage / Movers explorer)
             └─ tune segment → see members + CAUSES → Launch (preview → commit)
                   └─ InterventionRunner: resolve cohort → holdout split →
                      per treated member: fire the PLAY (MJ Action)
                        ├─ Notify Owner     → MJ User Notification (bell)
                        ├─ Route to Staffer → MJ Task (+ notification)
                        ├─ Draft Outreach   → MJ AI Prompt → draft on Task
                        └─ [Send Email      → MJ Communication]  (gated, later)
                      control members: assignment row only, marked do-not-contact
             staff work the artifacts in MJ's OWN surfaces (bell, tasks) — not a Sonar CRM
  └─ later recomputes update scores/bands
       └─ OutcomeMeasurer (on Measure / scheduled): baseline-at-assignment vs now,
          against the model's OUTCOME DEFINITION (default band recovery; org-defined
          escape hatch) → treatment vs control → SUCCESS LIFT (intent-to-treat)
             └─ Interventions tab: "+X pp · <definition>" per play
```

**MJ leverage map:** Actions (execution substrate) · AI Prompts/Templates (content) · Tasks +
Notifications (routing) · Communication (delivery, later) · Integrations/write-back (BulkSync,
later) · Scheduling + Queue Tasks (scheduled triggers + async fan-out, later) · Lists (segments as
first-class MJ Lists, later) · Record-change tracking (real business outcomes for lift, later) ·
AI Agents (the Intervention Drafter agent — the north star: cohort slips → agent reads the dominant
cause → drafts the cause-appropriate play → routes via MJ → holdout measures → learns which play
beats control for which cause).

## 6. Scope

### In scope (this phase, in order)
1. **CP-A — Kind refactor + de-CRM.** `Kind` column + nullable `ActionID` (migration, both
   dialects) · TrackOnly end-to-end (launch → assignments only → measure) · REMOVE the in-Sonar
   worklist state machine + the `Add to Worklist` no-op action (forward migration to retire it) ·
   launch panel gains the Kind choice ("Fire a play" / "Track only").
2. **CP-B — Play contract + Notify Owner + Route to Staffer.** `SonarInterventionPlay` base +
   contract · gate re-keyed to contract side-effect (Runtime/Approved check retained) · both plays
   built on MJ Notifications/Tasks · live-verified: notification in the bell, tasks with cause
   context, control untouched.
3. **CP-C — Draft Outreach.** Seeded MJ AI Prompt (cause-aware re-engagement draft) · play renders
   member context → draft on the task · live-verified across members with different causes ·
   contamination guard (control marked wherever cohorts render).

### Explicitly out of scope (this phase)
- Any Sonar-internal task/contact-state UI (removed, not improved).
- Real delivery (Play 4), BulkSync/write-back, scheduled triggers, segment→MJ List
  materialization, global contact ceilings — all designed-for, none built.
- Rung-2 cause auto-routing (intervention branches by cause). v1 surfaces causes; the human picks
  the play. Auto-routing needs a play library + measured history first.
- Positive/riser plays as a featured flow (the engine supports riser segments for free; the v1
  narrative is rescue/retention).
- The Intervention Drafter *agent* (north star; follows once plays + measurement are proven).

### Positioning constants
Rescue-first story ("stop revenue leakage"); outcome-agnostic engine with **Band Recovery** as the
opinionated UI default; holdout + measured lift in every tier — it's the product, not an upsell.
