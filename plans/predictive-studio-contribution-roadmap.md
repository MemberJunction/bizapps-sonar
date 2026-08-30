# Sonar → Predictive Studio: contribution roadmap

> **Status:** Sequencing doc. Decides *what goes upstream, in what order, and what deliberately does not.*
> **Companion:** [`sonar-contributions-to-predictive-studio.md`](sonar-contributions-to-predictive-studio.md) — the survey (what Sonar has, what PS lacks, per item).
> This doc does not restate that survey. It answers: given ten candidates, which do we actually do?

---

## 1. Verified state, as of 2026-08-06

Checked against the code rather than the survey's original write-up, because the survey is a month old
and the gaps it names could have closed without anyone updating it.

| Fact | Value | Source |
|---|---|---|
| MJ's Predictive Studio package version | **5.51.0** | `packages/AI/PredictiveStudio/*/package.json` |
| Sonar's MJ pin | **^5.45.0** | every Sonar package's `peerDependencies` |
| PS aggregate kinds supported | **2** | `feature-assembly-executor.ts:96` |
| Sonar aggregate kinds implemented | **8** | `factors/factorSql.ts:buildAggregateExpression` |
| Sonar window kinds implemented | **4** (+ AllTime) | `factors/factorSql.ts:CompiledWindow` |

The PS feature-assembly aggregate contract is still, verbatim:

```typescript
Aggregate: 'days_since_last_activity' | 'activity_count';
```

Against Sonar's `Count · Sum · Avg · Min · Max · DistinctCount · Exists · Recency`, over
`Rolling · Calendar · SinceEvent · RenewalRelative` windows, compiled to one set-based query for the
whole population.

**So the survey's headline claim holds at 5.51.0.** Item 1 is not stale.

---

## 2. The ten candidates are two different jobs

The survey ranks ten items by leverage. That ranking is right, and it obscures a split worth making
explicit before anyone starts work, because the two halves have different owners, different risk, and
different answers to "should we?"

### Group A — genuine PS gaps (items 1-5): contribute upstream

Capabilities PS is missing outright, where Sonar's implementation is the obvious donor. These land in
**MJ's PS package**, not in Sonar.

| # | Item | Effort (survey) |
|---|---|---|
| 1 | As-of time-window aggregates | Medium |
| 2 | Glass-box "rubric" model type | Medium |
| 3 | Per-record explainability | Low (linear/rubric), higher for trees |
| 4 | Auto join-path resolution | Low-medium |
| 5 | Richer normalization / transform library | Low-medium per op |

### Group B — Sonar's differentiators (items 6-10): decide before donating

Bands and transitions, `hadData` missing-data nuance, the code-as-feature contract plus promotion
gate, plain-English feature authoring, and the score-trajectory layer.

These are not gaps in PS so much as **the things that make Sonar a product rather than a config
screen**. Contributing them upstream is a strategy decision, not an engineering one, and it should be
taken deliberately rather than arrived at by finishing a checklist. Two of them (#7 `hadData`, #8
code-as-feature) have real correctness/extensibility value to PS and may be worth donating anyway;
#9 and #10 are closer to the core of what Sonar sells.

**Nothing in Group B should start before that call is made.**

---

> **Decision (2026-08-30, owner):** the Group B call is made. Items 1–8 are donated to Predictive
> Studio as typed components inside MJ core (`@memberjunction/predictive-studio*`), sequenced per
> MJ `plans/predictive-studio.md` and the typed-component program; items 9 (plain-English authoring
> loop) and 10 (score trajectory) remain Sonar's. Sonar consumes the donated components now that its
> MJ pin is on the 6.1 Edge stream (#62). §3 step 2 (the pin bump) is DONE; item 1 is prototyped in
> MJ directly.

## 3. Sequencing

1. **Land or close PR #11.** It has been open since 4 July, is docs-only (`+67/-0`), and blocks
   nothing while confusing everything. Resolve it before adding more plan surface.
2. **Bump Sonar's MJ pin.** PS is 5.51.0; Sonar pins 5.45. Nothing here is reachable until that moves,
   and on past form the bump is its own piece of work rather than a version-string edit.
3. **Do item 1, alone, first.** It is simultaneously PS's largest feature-assembly gap *and* the
   load-bearing risk of any "Sonar factors become PS features" migration. Every later item is easier
   once as-of windowed aggregates exist, and if item 1 proves harder than expected, that is the signal
   to stop before sinking effort into 2-5.
4. **Re-verify before each subsequent item.** The gap check in §1 took ten minutes and would have
   caught a stale premise. Repeat it per item rather than trusting this doc's own table.
5. **Hold Group B** pending the product call in §2.

---

## 4. Open questions

- **Does the bump come first, or a spike?** Item 1 could be prototyped against MJ 5.51 in a scratch
  branch without moving Sonar's pin, which would de-risk the bump rather than depend on it.
- **Where does item 1 actually live?** Extending PS's `DatedFeatureSpec.Aggregate` union is the small
  version; porting Sonar's compiler (which handles composite keys and multi-hop joins via `OPENJSON`)
  is the real one. The survey does not decide this, and the effort estimate differs by a lot.
- **What is the contribution mechanism?** PRs into MJ from this team, or a hand-off to whoever owns
  PS? Item 1 alone touches feature assembly, which has its own correctness guarantees
  (fit-once/apply-everywhere, leakage guards) that Sonar's compiler has never had to satisfy.
- **Group B**: contribute, keep, or license? Not an engineering question, and not one this doc should
  answer.

---

## 5. What this doc deliberately does not do

It does not estimate Group A beyond the survey's own figures, because those were written against MJ
5.45 and only item 1's premise has been re-checked. Treat items 2-5's effort as unvalidated.
