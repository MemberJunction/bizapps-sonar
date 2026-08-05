-- =============================================================================
-- V202607271900__v0.5.x_Count_Population_Action.pg.sql
-- PostgreSQL twin of migrations/V202607271900__v0.5.x_Count_Population_Action.sql
-- =============================================================================
-- Registers the "Sonar: Count Population" Action (DriverClass SonarCountPopulation).
-- See the SQL Server twin for the full rationale. In short: the Model Builder header
-- printed the anchor entity's TOTAL count as the scored population ("2,000 in
-- population" for a model scoping 66), and the population filter is compiled to SQL
-- server-side, so the browser cannot answer "how many are in scope?" without
-- duplicating that compiler. This Action answers it where the compiler lives.
--
-- ActionCategory and AIAgent are resolved BY NAME, not by hardcoded ID: the
-- PostgreSQL baseline registers core metadata under different IDs than SQL Server.
--
-- Idempotent: every insert is guarded on its natural key.
-- =============================================================================

-- The Action itself.
INSERT INTO __mj."Action"
  ("ID", "CategoryID", "Name", "Description", "Type", "Status", "DriverClass", "IconClass", "CodeApprovalStatus")
SELECT
  '5044A100-001B-4000-8000-00000000001B'::uuid,
  c."ID",
  'Sonar: Count Population',
  'Counts the anchor records a scoring model actually scores, with its population filter applied. Returns the scoped count, the unfiltered entity total, and whether a filter narrowed it. Read-only.',
  'Custom',
  'Active',
  'SonarCountPopulation',
  'fa-solid fa-users',
  'Approved'
FROM __mj."ActionCategory" c
WHERE c."Name" = 'Business Apps'
  AND NOT EXISTS (
    SELECT 1 FROM __mj."Action" e WHERE e."ID" = '5044A100-001B-4000-8000-00000000001B'::uuid
  );

-- Its params: ModelID in, Result (JSON) back. 'Both' rather than 'Output' because the MJ
-- ActionResolver only serializes 'Both' params into the GraphQL ResultData the client reads.
INSERT INTO __mj."ActionParam"
  ("ID", "ActionID", "Name", "Type", "ValueType", "IsRequired", "IsArray", "Description")
SELECT v.id::uuid, '5044A100-001B-4000-8000-00000000001B'::uuid, v.name, v.type, 'Scalar', v.isrequired, false, v.description
FROM (VALUES
  ('5044A100-001B-4000-8000-0000000000B1', 'ModelID', 'Input', true,
   'ID of the Score Model whose population to count.'),
  ('5044A100-001B-4000-8000-0000000000B2', 'Result',  'Both',  false,
   'JSON: { scoped, total, filtered }.')
) AS v(id, name, type, isrequired, description)
WHERE NOT EXISTS (
  SELECT 1 FROM __mj."ActionParam" e
  WHERE e."ActionID" = '5044A100-001B-4000-8000-00000000001B'::uuid AND e."Name" = v.name
);

-- Give the Sonar Authoring Agent the tool too, matching the other read actions.
INSERT INTO __mj."AIAgentAction" ("ID", "AgentID", "ActionID", "Status", "ResultExpirationMode")
SELECT 'AAC70000-001B-4000-8000-00000000001B'::uuid, a."ID", '5044A100-001B-4000-8000-00000000001B'::uuid, 'Active', 'None'
FROM __mj."AIAgent" a
WHERE a."Name" = 'Sonar Authoring Agent'
  AND NOT EXISTS (
    SELECT 1 FROM __mj."AIAgentAction" e
    WHERE e."AgentID" = a."ID" AND e."ActionID" = '5044A100-001B-4000-8000-00000000001B'::uuid
  );
