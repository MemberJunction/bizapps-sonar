-- Outcome-agnostic lift (plan §7.5): a model defines what "success" means for its interventions,
-- rather than Sonar hardcoding "renewal". OutcomeDefinitionJSON holds a small declarative rule the
-- OutcomeMeasurer evaluates per treated member; NULL = the built-in default (band recovery — the
-- member climbed at least one band from their baseline). Shapes:
--   {"type":"BandRecovery"}                                          (default; score/engagement proxy)
--   {"type":"ReachScore","minScore":70}                             (current normalized score >= N)
--   {"type":"AnchorField","field":"Status","op":"=","value":"Active"} (the member's OWN domain field —
--       the real escape from the score-as-target thermometer; e.g. Status flipped to Active)

ALTER TABLE ${flyway:defaultSchema}.ScoreModel ADD OutcomeDefinitionJSON NVARCHAR(MAX) NULL;
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Declarative rule defining what "success" means when measuring an intervention''s lift on this model''s members (BandRecovery | ReachScore | AnchorField). NULL = default band recovery. Keeps outcomes org-defined, not hardcoded.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel', @level2type = N'COLUMN', @level2name = N'OutcomeDefinitionJSON';
GO
