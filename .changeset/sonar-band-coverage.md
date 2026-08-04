---
"@mj-biz-apps/sonar-ng": patch
"@mj-biz-apps/sonar-core-entities-server": patch
---

Keep score bands tiling their scale, so no score lands in a band that doesn't exist.

`ScoringEngine.assignBand` documents its model as "half-open, contiguous, non-overlapping" and relies on it, but nothing enforced it and both failure modes were silent. A GAP meant `assignBand` returned `undefined`, so those anchors got no band at all and dropped out of the distribution, triage and movers. An OVERLAP meant two bands matched and `.find()` awarded the score to whichever sorted first — quietly voiding the "deterministic regardless of band order" property the same comment claims.

Because bands are half-open, adjacent ones SHARE a boundary (0–40, 40–70, 70–100), so moving one band's edge is really moving a seam between two bands. A new pure module (`custom/core/band-coverage.ts`) plans each mutation so the set still tiles:

- **Editing** an edge drags the touching neighbour with it. Requests that can't be honoured are refused rather than reinterpreted: an inverted range (a typo) previously "resolved" by dragging neighbours to meet the nonsense edges, reshaping bands the user never touched, and an out-of-scale value clamped to leave the neighbour one point wide. Both now change nothing and say why. Ends are pinned to the model's `ScoreScaleMin`/`Max`, otherwise the hole just relocates to the end of the scale.
- **Adding** a band is now a SPLIT of an existing one. There is no free space in a tiling to append into, and the old seed ("start where the last band ends, run to 100") produced a zero-width `100–100` band on any complete set. The form asks for one number — where to split — and derives the top from the host, which is named in the hint.
- **Deleting** a band hands its vacated range to the band BELOW, so orphaned members land in the lower band rather than being silently promoted and dropping out of interventions aimed at the unhealthy end. Deletion is genuinely refusable (`Score.BandID` has an FK, so a band with computed scores can't be removed), so the neighbour stretch is rolled back on failure instead of leaving an overlap, and the reason is surfaced instead of "please try again".

Backend enforcement now matches: the publish gate rejects a model whose bands don't cover its scale, naming the offending range, and `ScoreBandEntityServer` rejects an inverted range on every save. Coverage is checked at publish rather than per row on purpose — moving a boundary legitimately takes two writes and the set is briefly inconsistent between them, so a per-row check would reject the first half of every valid edit.

Two fixes fell out of this. The band rail identified bands by their colour key, a four-value bucket (`healthy`/`watch`/`atrisk`/`critical`) that collides once a set has four or more bands: rows showed a neighbour's range, one click opened two popovers, and edits or deletes could land on the wrong band. Identity is the band ID now; the key is only paint. And `score-band-builder` no longer assumes a 0–100 scale (it takes the model's) and no longer swallows failed deletes while reporting a clean save.
