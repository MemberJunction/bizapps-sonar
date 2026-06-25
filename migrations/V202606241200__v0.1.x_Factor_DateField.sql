-- Add Factor.DateField — the related-entity activity-date column a windowed factor filters on
-- (e.g. RegistrationDate, the "when did it happen" column). Until now the engine read this from
-- TimeWindow.AnchorDateField, which is a latent bug: TimeWindow must stay reusable/entity-agnostic,
-- and a Rolling window with AnchorDateField=null silently counted everything. This column moves the
-- "which date column" decision onto the Factor (where the source entity is known), freeing
-- TimeWindow.AnchorDateField to mean what §5.2 intended: the ANCHOR-side boundary date for
-- SinceEvent / RenewalRelative windows.
--
-- Migration only adds the column; the engine rewiring (FactorCompiler/factorSql read DateField for the
-- related date; wire SinceEvent/RenewalRelative) and the factor-builder DateField picker follow in code.
ALTER TABLE ${flyway:defaultSchema}.Factor
    ADD DateField NVARCHAR(200) NULL;
GO

EXEC sp_addextendedproperty @name = N'MS_Description',
    @value = N'The date column on the factor''s related (source) entity that a time window filters on — the "when did it happen" column (e.g. RegistrationDate). Used by Rolling/Calendar/SinceEvent windows; null = no date filter (count everything in scope).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor',
    @level2type = N'COLUMN', @level2name = N'DateField';
GO
