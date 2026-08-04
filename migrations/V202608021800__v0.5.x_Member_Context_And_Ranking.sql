-- =============================================================================
-- V202608021800__v0.5.x_Member_Context_And_Ranking.sql
-- =============================================================================
-- Document two new layers on "Sonar: Preview Segment": conditions on the MEMBER RECORD, and RANKING.
--
-- Why they matter together: a rule that matches 1,455 people is a report, not a work list. Member
-- conditions make a cohort specific ("first-year members in Texas who are sliding"), and ranking makes
-- it finite ("the forty my team can actually call this week"). Neither was expressible before: tenure,
-- dormancy, region and segment all live on the anchor record and were invisible to targeting, and the
-- order was always worst-score-first, which quietly assumes the lowest score is the best use of an hour.
--
-- Ranking is part of the RULE, not the display. The run cap truncates the resolved cohort, so the rank
-- order decides who actually gets treated. The action's OrderBy param stays display-only and is ignored
-- whenever a rule states its own rank, so the previewed order can never differ from the treated order.
--
-- A member condition naming a field the anchor entity does not have FAILS the resolve (VALIDATION_ERROR)
-- rather than being skipped. A skipped condition would silently widen the cohort, and a wider cohort
-- means contacting people the rule was written to exclude.
--
-- UPDATE-only: the param rows were seeded by V202608021300, which is already applied, and editing an
-- applied migration changes its Flyway checksum and aborts every upgrade.
-- Idempotent; safe to re-run.
-- PG twin: migrations-pg/V202608021800__v0.5.x_Member_Context_And_Ranking.pg.sql
-- =============================================================================

UPDATE [__mj].[ActionParam]
SET Description = N'JSON SegmentFilter. Point-in-time: { bandId?, minScore?, maxScore?, minDelta?, maxDelta?, crossedBandOnly? }. Trust gate: { minDataCompleteness? }. Trajectory (reads ScoreHistory): { windowDays?, minSlopePer30Days?, maxSlopePer30Days?, minDeclineRun?, minNetDrop?, maxVolatility?, minSnapshots? }. Reason, i.e. WHICH SIGNAL is dragging the member down (reads ScoreFactorContribution): { reason: { dominantFactorIds?: [FactorID], weakOnFactorId?: FactorID, maxNormalizedValue?: 0-1 (default 0.5), requireNoData?: bool, requireData?: bool } }. Member context, i.e. conditions on the ANCHOR RECORD rather than the score: { anchor: [{ field, op, value }] } where op is one of eq/neq/in/notIn/gte/lte/isNull/isNotNull/withinLastDays/olderThanDays/withinNextDays. The date operators take a number of DAYS relative to now, which is how urgency is actually spoken: JoinDate olderThanDays 365 = a member for over a year; LastActivityDate olderThanDays 90 = dormant for a quarter; a future-dated field withinNextDays 60 = about to come due. olderThanDays is exclusive at the boundary so it and withinLastDays partition cleanly. Ordering: { rank: { mode, urgencyField?, valueField?, weights? } } where mode is worstScore (default) / fastestDecline / biggestDrop / soonest / highestValue / priority. urgencyField is an anchor DATE field (sooner = higher priority, within a 90-day horizon); valueField is an anchor NUMBER field; priority blends severity, urgency and value (defaults 0.5/0.3/0.2, renormalised over whichever terms the rule can supply). All layers AND together. Rank is part of the RULE: the run cap truncates the resolved cohort, so this order decides who gets treated. A condition naming a field the anchor entity does not have FAILS with VALIDATION_ERROR rather than being ignored, because a skipped condition would silently widen the cohort. Use dominantFactorIds for a homogeneous group (everyone shares the same main problem); use weakOnFactorId when the action targets one behaviour regardless of whether it is the member''s worst. A member with no contributions on record never matches a reason condition. requireNoData/requireData are mirror gates on whether the signal has any records for the member at all: a data gap needs the integration fixed, not a person contacted, so the two are separate groups even when they share a dominant factor.'
WHERE ID = '5044A100-0025-4000-8000-0000000000A2';
GO

UPDATE [__mj].[ActionParam]
SET Description = N'DISPLAY ONLY, and IGNORED when the filter states its own rank (see FilterJSON) so the previewed order can never differ from the order a capped run would treat. ''BiggestDrop''/''BiggestGain'' re-sort this RESPONSE by the last-run delta; anything else keeps the resolved order.'
WHERE ID = '5044A100-0025-4000-8000-0000000000A6';
GO

UPDATE [__mj].[ActionParam]
SET Description = N'JSON: { total, page, pageSize, usedTrajectory, breakdown: [{ factorId, label, count, share, hadData }], members: [{ scoreId, anchorRecordId, anchorRecordKeyJSON, normalizedScore, bandId, delta, shape, reasonLabel, dominantFactorId, reasonHadData }] }. Members come back in the rule''s rank order, which is the order a capped run would treat them in. breakdown covers the WHOLE cohort (not just the page) and is how the group splits by main problem, biggest slice first; factorId null = Sonar cannot tell why those members are low. Each member carries reasonLabel ("Low Event Registrations" / "No Event Registrations") plus the dominantFactorId behind it, so a breakdown row can be turned straight back into a rule. hadData/reasonHadData false = the signal has NO records for that member, so the low score is a data gap rather than measured disengagement. shape is null unless the rule used trajectory bounds.'
WHERE ID = '5044A100-0025-4000-8000-0000000000A5';
GO
