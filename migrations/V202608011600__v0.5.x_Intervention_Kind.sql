-- Intervention execution KIND (plan re-anchor): an intervention either fires a play
-- (Kind='Action', ActionID set) or just tracks a real-world treatment (Kind='TrackOnly', no action).
-- So ActionID becomes nullable. Also retires the stopgap no-op "Add to Worklist" play — routing a
-- human is now a real play (Route to Staffer) on MJ Tasks, and the in-Sonar worklist tooling is gone.

ALTER TABLE ${flyway:defaultSchema}.Intervention ADD Kind NVARCHAR(20) NOT NULL CONSTRAINT DF_Intervention_Kind DEFAULT 'Action';
GO
ALTER TABLE ${flyway:defaultSchema}.Intervention ADD CONSTRAINT CK_Intervention_Kind CHECK (Kind IN ('Action', 'TrackOnly', 'BulkSync'));
GO
ALTER TABLE ${flyway:defaultSchema}.Intervention ALTER COLUMN ActionID UNIQUEIDENTIFIER NULL;
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Execution kind: Action (fires a play — the MJ Action in ActionID — per treated member), TrackOnly (no action; Sonar only splits treatment/control and measures a real-world treatment), or BulkSync (reserved — push the set to another platform). ActionID is required only for Action.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Intervention', @level2type = N'COLUMN', @level2name = N'Kind';
GO

-- Retire the no-op worklist play (block 001D): neutralize any intervention that used it (a retired
-- play → the intervention just tracks now), and DISABLE the action so it drops from the picker.
-- (Disabled, not deleted: the action may carry ActionExecutionLog history, so a hard delete would
-- violate FKs. The action class + metadata are removed from the codebase; the disabled row is inert.)
UPDATE ${flyway:defaultSchema}.Intervention SET ActionID = NULL, Kind = 'TrackOnly'
    WHERE ActionID = '5044A100-001D-4000-8000-00000000001D';
GO
UPDATE [__mj].[Action] SET Status = 'Disabled' WHERE ID = '5044A100-001D-4000-8000-00000000001D';
GO
