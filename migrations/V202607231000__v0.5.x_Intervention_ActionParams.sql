-- Interventions carry their play's static params (plan §5.6 follow-up): ActionParamsJSON stores the
-- [{name,value}] list handed to the MJ Action per fire (a `{{member}}` token in any value is replaced
-- with the member's anchor id). This is what lets AUTONOMOUS (OnEnterSegment) fires run parameterized
-- plays — previously only a Manual launch could supply params, so autonomous fires were param-less.

ALTER TABLE ${flyway:defaultSchema}.Intervention ADD ActionParamsJSON NVARCHAR(MAX) NULL;
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'JSON [{name,value}] params handed to the intervention''s Action on every fire; a {{member}} token in a value is replaced with the member''s anchor id. Null = fire with no params.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Intervention', @level2type = N'COLUMN', @level2name = N'ActionParamsJSON';
GO
