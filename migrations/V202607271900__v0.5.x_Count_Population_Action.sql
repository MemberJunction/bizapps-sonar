-- =============================================================================
-- V202607271900__v0.5.x_Count_Population_Action.sql
-- =============================================================================
-- Registers the "Sonar: Count Population" Action (DriverClass SonarCountPopulation).
--
-- WHY: the Model Builder header showed the anchor entity's TOTAL record count and
-- labelled it as the scored population, so a model filtered down to 66 members
-- still read "2,000 in population". The population filter is compiled to SQL by
-- the engine (RecomputeOrchestrator.compilePopulationFilter), so the browser
-- cannot answer "how many are in scope?" without duplicating that compiler --
-- a DRY break and a client-side SQL-building surface. This Action answers it
-- where the compiler already lives (two count_only reads; nothing is scored or
-- persisted). It is also a sensible agent tool: "how many members does this
-- model score?" is a question the authoring agent gets asked.
--
-- WHY A SEPARATE FORWARD MIGRATION (not folded into the seed):
--   The seed V202607142340 shipped in v0.2.0. Editing it would change its Flyway
--   checksum and abort every upgrade (and Flyway never re-runs an applied
--   version, so the rows would never reach an upgraded install). A new forward
--   migration reaches BOTH fresh installs and upgraders, and -- running after the
--   seed -- the ActionCategory and AIAgent it FK-references already exist.
--
-- The ActionCategory and AIAgent are resolved BY NAME rather than by hardcoded
-- ID: the PostgreSQL baseline registers core metadata under different IDs than
-- SQL Server, and keeping both twins name-resolved means they stay in step.
--
-- Idempotent: every insert is guarded (WHERE NOT EXISTS on the natural key), so
-- it is safe on a fresh install, an upgrade, or a re-run.
-- =============================================================================

-- The Action's ID is written as a LITERAL rather than a @variable, in both twins. Hardcoded UUIDs
-- are the house style for seed/metadata migrations, and the CI seed-agent-tools validator matches
-- Action IDs against the links that reference them textually -- behind a variable the row is
-- invisible to that check, so the ordering guarantee silently wouldn't cover this migration.
DECLARE @CategoryID UNIQUEIDENTIFIER =
  (SELECT TOP 1 ID FROM [__mj].[ActionCategory] WHERE Name = N'Business Apps');

-- The Action itself.
INSERT INTO [__mj].[Action]
  (ID, CategoryID, Name, Description, Type, Status, DriverClass, IconClass, CodeApprovalStatus)
SELECT
  '5044A100-001B-4000-8000-00000000001B',
  @CategoryID,
  N'Sonar: Count Population',
  N'Counts the anchor records a scoring model actually scores, with its population filter applied. Returns the scoped count, the unfiltered entity total, and whether a filter narrowed it. Read-only.',
  N'Custom',
  N'Active',
  N'SonarCountPopulation',
  N'fa-solid fa-users',
  N'Approved'
WHERE NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = '5044A100-001B-4000-8000-00000000001B');

-- Its params: ModelID in, Result (JSON) back. 'Both' rather than 'Output' because the MJ
-- ActionResolver only serializes 'Both' params into the GraphQL ResultData the client reads.
INSERT INTO [__mj].[ActionParam]
  (ID, ActionID, Name, Type, ValueType, IsRequired, IsArray, Description)
SELECT v.ID, '5044A100-001B-4000-8000-00000000001B', v.Name, v.Type, N'Scalar', v.IsRequired, 0, v.Description
FROM (VALUES
  ('5044A100-001B-4000-8000-0000000000B1', N'ModelID', N'Input', CAST(1 AS BIT),
   N'ID of the Score Model whose population to count.'),
  ('5044A100-001B-4000-8000-0000000000B2', N'Result',  N'Both',  CAST(0 AS BIT),
   N'JSON: { scoped, total, filtered }.')
) AS v(ID, Name, Type, IsRequired, Description)
WHERE NOT EXISTS (
  SELECT 1 FROM [__mj].[ActionParam] e WHERE e.ActionID = '5044A100-001B-4000-8000-00000000001B' AND e.Name = v.Name
);

-- Give the Sonar Authoring Agent the tool too, matching the other read actions.
INSERT INTO [__mj].[AIAgentAction] (ID, AgentID, ActionID, Status, ResultExpirationMode)
SELECT 'AAC70000-001B-4000-8000-00000000001B', a.ID, '5044A100-001B-4000-8000-00000000001B', N'Active', N'None'
FROM [__mj].[AIAgent] a
WHERE a.Name = N'Sonar Authoring Agent'
  AND NOT EXISTS (
    SELECT 1 FROM [__mj].[AIAgentAction] e WHERE e.AgentID = a.ID AND e.ActionID = '5044A100-001B-4000-8000-00000000001B'
  );

GO
