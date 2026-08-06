# Demo data

Scripts that make the demo database *demonstrate* something, as opposed to merely containing rows.

They are checked in because the numbers they produce end up in front of stakeholders, and a number
nobody can reproduce is a number nobody should trust. Each one is a dry run by default, deterministic,
and reversible.

> These target the **demo/dev database only** (`.env` `DB_DATABASE`, currently `Sonar_Demo_Slice`).
> Nothing here belongs in a migration and none of it ships with the app.

---

## `rebuild-lift-story.mjs`

```bash
node demo-data/rebuild-lift-story.mjs                            # report the plan, write nothing
node demo-data/rebuild-lift-story.mjs --apply                    # seed, recompute, measure
node demo-data/rebuild-lift-story.mjs --apply --outcome=activity # ...against the domain outcome
node demo-data/rebuild-lift-story.mjs --revert                   # undo the seeding
```

### The problem it solves

Sonar's central claim is *"we measured it, we didn't assume it"*: a treated cohort against a randomised
holdout. In the demo data that claim was unfalsifiable. After the play fired, nothing about any member
changed, so every outcome came back `NoChange` and lift computed as **0.0**. A viewer could not tell a
working measurement pipeline from a broken one, and for a while it *was* broken (see
[HANDOFF.md](../HANDOFF.md), the view/metadata width trap) without anyone noticing, because 0.0 is what
both states look like.

### What it does

1. **Seeds** post-outreach purchases for part of each cohort, more of treatment than of control
2. **Sets** the model's outcome definition to a bar those purchases can actually clear
3. **Clears** stacked score snapshots and the stale zero-delta outcome rows
4. **Recomputes** the model, so `Score` / `ScoreHistory` reflect the new activity
5. **Measures** the intervention and prints the lift

Steps 4 and 5 run the real `RecomputeOrchestrator` and `OutcomeMeasurer`. **The script never writes a
Score, a ScoreHistory row or an InterventionOutcome itself**. It seeds ordinary domain purchases and
lets the engine derive everything downstream. That boundary is the point: if the script wrote the
outcome rows, running it would prove nothing about the measurement pipeline.

### Why the lift is non-zero, and why that is not rigged

Every member gets a stable propensity `h` in 0..99 from a hash of their own id. The **same ranking**
applies in both arms; the intervention only moves the cut-off:

| | strong responder | light responder | no response |
|---|---|---|---|
| **Treatment** | `h < 35` | `h < 60` | else |
| **Control** | `h < 10` | `h < 20` | else |

So the lowest-`h` members convert in **both** arms, because they were going to renew anyway, which is why the
control group's baseline is deliberately not zero. Members in the middle convert *only* when contacted.
That middle band is the causal effect, and treatment-minus-control is exactly the estimator that
recovers it. If this setup produced a lift near zero, the measurement would be wrong.

Two properties keep it defensible:

- **The seeded counts never exceed the population's existing maximum.** Both scoring factors are
  MinMax-normalised against population min/max, so pushing any member past the top of the scale would
  *restretch* it and drag every uninvolved member's score down. Control would appear to "decline" for a
  reason having nothing to do with the intervention, and the lift would be an artifact of the
  normaliser. The script asserts this and refuses to run if a plan would breach the ceiling.
- **Non-responders move by exactly 0.** Verified after each run; it is the check that proves the point
  above actually held.

### What a "response" is

These 100 members are one-payment members: joined, paid once, went quiet. The realistic post-nudge
behaviour is buying something. A **strong** responder makes three purchases over the five days after the
play fired (renewal, conference registration, publication); a **light** responder just renews. Both are
ordinary `Invoice` + `Payment` rows in `AssociationDemo`, identical in shape to the 6,683 already there.

### Two outcome definitions

`ScoreModel.OutcomeDefinitionJSON` decides what counts as success. The script can install either, and
which one you pick changes what the demo is *arguing*.

> **The demo database currently has `activity` installed**, because it is the stronger claim. `--apply`
> without a flag will switch it back to `score`.

**`--outcome=score`** (default) sets `{"type":"ReachScore","minScore":20}`:

```
outcome definition : score ≥ 20
cohorts            : 81 treated · 19 control
success rate       : 43.2% treated vs 5.3% control   → lift +37.9pp
mean score delta   : +10.87 treated vs +1.96 control   → lift +8.91
band-up rate       : 0.0% treated vs 0.0% control   → lift +0.0pp
```

Simple, but it is a **thermometer**: Sonar grading its own homework. Success is defined in terms of the
number Sonar itself produces.

**`--outcome=activity`** sets `{"type":"AnchorField","field":"LastActivityDate","op":">=","value":"2026-08-01"}`:

```
outcome definition : LastActivityDate >= 2026-08-01
cohorts            : 81 treated · 19 control
success rate       : 59.3% treated vs 15.8% control   → lift +43.5pp
mean score delta   : +10.87 treated vs +1.96 control   → lift +8.91
band-up rate       : 0.0% treated vs 0.0% control   → lift +0.0pp
```

Success is now a condition on the member's **own domain record**, decoupled from the score entirely.
That is the stronger claim and the better answer to "did this actually work". The success counts land
exactly on the responder counts (48/81 and 3/19), and every non-success has a NULL `LastActivityDate`,
which is the null-handling rule doing its job: a member nothing is known about is never a win.

> This mode is what proves the `AnchorField` date comparison actually works. It used to be broken in a
> way that reported success for the entire population: a `Date` stringifies as `"Sat Aug 01 2026 …"`, so
> the old string fallback compared `"S"` against `"2"` and said yes to every date in history.

**Band-up lift is 0.0 in both, on purpose, and it is the honest reading.** The At Risk band runs 0–40 and
these members started at 0; nobody climbs 40 points in five days on a believable number of purchases.
Forcing a band recovery would have meant fabricating six or seven transactions per member in under a week.
So what the demo shows is the leading indicator moving before the band flips, which is the true shape of an
early intervention rather than a flattering one.

### What it writes outside Sonar

Two things in `AssociationDemo`, both reversible:

- `Invoice` + `Payment` rows, tagged, one pair per purchase.
- `Member.LastActivityDate` for responders only, set to their last purchase date. It was NULL for all
  2,000 members before this (see the fix-me list in [HANDOFF.md](../HANDOFF.md)); non-responders stay NULL
  deliberately, so the `activity` outcome has genuine negatives rather than a column full of dates.

The reset for `LastActivityDate` is narrow on purpose: only members on this intervention's roster, and only
where the value falls inside the seeded window. A blanket `SET NULL` is equivalent today but would destroy
real work the day somebody populates the column properly.

### Reversibility

Every seeded row is tagged (`INV-SONARDEMO-…`, `TXN-SONARDEMO-…`), so `--revert` is a single predicate.
`--apply` clears the previous seeding first, so re-running lands on the same state rather than
accumulating, verified by running it twice and getting byte-identical lift.

`--revert` leaves scores **stale** (it removes the purchases but does not recompute). Either recompute,
or just re-run with `--apply`.

### If you change the demo model

The script hard-codes the Engagement model (`0D4A1014-…`) and one intervention (`E1F34547-…`), and the
`SUCCESS_SCORE` bar is tuned to what three purchases are actually worth under the current factor weights
and MinMax population. Change the factors, the weights, or the band set and that bar needs re-deriving:
the maths is written out in the script header.

It also **overwrites `ScoreModel.OutcomeDefinitionJSON`**. To hand the model back to the default
band-recovery definition:

```sql
UPDATE __mj_BizAppsSonar.ScoreModel
   SET OutcomeDefinitionJSON = NULL
 WHERE ID = '0D4A1014-FCCC-4832-9F47-87E6445F75FE';
```
