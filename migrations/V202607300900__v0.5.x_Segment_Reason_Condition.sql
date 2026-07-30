-- =============================================================================
-- V202607300900__v0.5.x_Segment_Reason_Condition.sql
-- =============================================================================
-- Document the REASON layer on "Sonar: Preview Segment".
--
-- A targeting rule can now say WHY a member is low, not just how low: which signal is dragging their
-- score down. That matters because a cohort picked by score (or by trajectory) is a mixed bag —
-- members who stopped attending events sitting next to members who stopped opening email — and one
-- action can't fit both. Selecting on the reason is what makes a group homogeneous enough to act on.
--
-- Two shapes of question, because they group differently:
--   dominantFactorIds  → "this signal is the member's MAIN problem"  (homogeneous groups)
--   weakOnFactorId     → "the member is weak on this signal at all"  (broader)
--
-- The preview also now RETURNS the breakdown: how the whole cohort splits by main problem, so an
-- operator can see a group is really three problems before committing to one of them.
--
-- This is an UPDATE-only migration: the param rows were seeded by V202607291600, which is already
-- applied, and editing an applied migration changes its Flyway checksum and aborts every upgrade.
-- Descriptions are the contract an agent reads to know a param exists, so they have to be current.
-- Idempotent; safe to re-run. PG twin: migrations-pg/V202607300900__v0.5.x_Segment_Reason_Condition.pg.sql
-- =============================================================================

UPDATE [__mj].[ActionParam]
SET Description = N'JSON SegmentFilter. Point-in-time: { bandId?, minScore?, maxScore?, minDelta?, maxDelta?, crossedBandOnly? }. Trust gate: { minDataCompleteness? }. Trajectory (reads ScoreHistory): { windowDays?, minSlopePer30Days?, maxSlopePer30Days?, minDeclineRun?, minNetDrop?, maxVolatility?, minSnapshots? }. Reason, i.e. WHICH SIGNAL is dragging the member down (reads ScoreFactorContribution): { reason: { dominantFactorIds?: [FactorID], weakOnFactorId?: FactorID, maxNormalizedValue?: 0-1 (default 0.5), requireNoData?: bool, requireData?: bool } }. Use dominantFactorIds for a homogeneous group (everyone shares the same main problem); use weakOnFactorId when the action targets one behaviour regardless of whether it is the member''s worst. A member with no contributions on record never matches a reason condition. requireNoData/requireData are mirror gates on whether the signal has any records for the member at all: a data gap needs the integration fixed, not a person contacted, so the two are separate groups even when they share a dominant factor.'
WHERE ID = '5044A100-0025-4000-8000-0000000000A2';
GO

UPDATE [__mj].[ActionParam]
SET Description = N'JSON: { total, page, pageSize, usedTrajectory, breakdown: [{ factorId, label, count, share, hadData }], members: [{ scoreId, anchorRecordId, anchorRecordKeyJSON, normalizedScore, bandId, delta, shape, reasonLabel, dominantFactorId, reasonHadData }] }. breakdown covers the WHOLE cohort (not just the page) and is how the group splits by main problem, biggest slice first; factorId null = Sonar cannot tell why those members are low. Each member carries reasonLabel ("Low Event Registrations" / "No Event Registrations") plus the dominantFactorId behind it, so a breakdown row can be turned straight back into a rule. hadData/reasonHadData false = the signal has NO records for that member, so the low score is a data gap rather than measured disengagement. shape is null unless the rule used trajectory bounds.'
WHERE ID = '5044A100-0025-4000-8000-0000000000A5';
GO
