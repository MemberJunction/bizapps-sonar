-- =============================================================================
-- 01__Detach_Optional_References.sql
-- =============================================================================
-- PHASE 1 of 2 -- release every OPTIONAL reference into Sonar's rows.
--
-- These FK columns are NULL-able, so the referencing row stays perfectly valid
-- without Sonar: a Conversation whose default agent happened to be Sonar's, a
-- Task assigned to it, a RecordProcess that called one of its Actions, an
-- AIPromptRun logged against a run being removed. Those rows belong to the
-- customer. Uninstall nulls the pointer and leaves the row standing.
--
-- Deleting them instead would be the most destructive thing this teardown could
-- do, which is exactly why phase 2 only ever deletes NOT NULL dependants.
--
-- 71 columns detached, every statement scoped to Sonar's seeded IDs.
-- =============================================================================

-- Action.ParentID -> Action
UPDATE "${mjSchema}"."Action" SET "ParentID" = NULL WHERE "ParentID" IN (
  '5044A100-0001-4000-8000-000000000001',
  '5044A100-0002-4000-8000-000000000002',
  '5044A100-0003-4000-8000-000000000003',
  '5044A100-0005-4000-8000-000000000005',
  '5044A100-0008-4000-8000-000000000008',
  '5044A100-0009-4000-8000-000000000009',
  '5044A100-000A-4000-8000-00000000000A',
  '5044A100-000B-4000-8000-00000000000B',
  '5044A100-000C-4000-8000-000000000008',
  '5044A100-000D-4000-8000-000000000009',
  '5044A100-000E-4000-8000-00000000000E',
  '5044A100-000F-4000-8000-00000000000F',
  '5044A100-0010-4000-8000-000000000010',
  '5044A100-0011-4000-8000-000000000011',
  '5044A100-0012-4000-8000-000000000012',
  '5044A100-0013-4000-8000-000000000013',
  '5044A100-0014-4000-8000-000000000014',
  '5044A100-0015-4000-8000-000000000015',
  '5044A100-0016-4000-8000-000000000016',
  '5044A100-0017-4000-8000-000000000017',
  '5044A100-0018-4000-8000-000000000018',
  '5044A100-0019-4000-8000-000000000019',
  '5044A100-001A-4000-8000-00000000001A',
  '5044A100-001B-4000-8000-00000000001B'
);

-- AIAgent.ParentID -> AIAgent
UPDATE "${mjSchema}"."AIAgent" SET "ParentID" = NULL WHERE "ParentID" IN (
  'CF1D58BA-451E-4515-89BD-AC3F16A19534'
);

-- AIAgent.DefaultCoAgentID -> AIAgent
UPDATE "${mjSchema}"."AIAgent" SET "DefaultCoAgentID" = NULL WHERE "DefaultCoAgentID" IN (
  'CF1D58BA-451E-4515-89BD-AC3F16A19534'
);

-- AIPrompt.ResultSelectorPromptID -> AIPrompt
UPDATE "${mjSchema}"."AIPrompt" SET "ResultSelectorPromptID" = NULL WHERE "ResultSelectorPromptID" IN (
  '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
);

-- AIAgentStep.ActionID -> Action
UPDATE "${mjSchema}"."AIAgentStep" SET "ActionID" = NULL WHERE "ActionID" IN (
  '5044A100-0001-4000-8000-000000000001',
  '5044A100-0002-4000-8000-000000000002',
  '5044A100-0003-4000-8000-000000000003',
  '5044A100-0005-4000-8000-000000000005',
  '5044A100-0008-4000-8000-000000000008',
  '5044A100-0009-4000-8000-000000000009',
  '5044A100-000A-4000-8000-00000000000A',
  '5044A100-000B-4000-8000-00000000000B',
  '5044A100-000C-4000-8000-000000000008',
  '5044A100-000D-4000-8000-000000000009',
  '5044A100-000E-4000-8000-00000000000E',
  '5044A100-000F-4000-8000-00000000000F',
  '5044A100-0010-4000-8000-000000000010',
  '5044A100-0011-4000-8000-000000000011',
  '5044A100-0012-4000-8000-000000000012',
  '5044A100-0013-4000-8000-000000000013',
  '5044A100-0014-4000-8000-000000000014',
  '5044A100-0015-4000-8000-000000000015',
  '5044A100-0016-4000-8000-000000000016',
  '5044A100-0017-4000-8000-000000000017',
  '5044A100-0018-4000-8000-000000000018',
  '5044A100-0019-4000-8000-000000000019',
  '5044A100-001A-4000-8000-00000000001A',
  '5044A100-001B-4000-8000-00000000001B'
);

-- RecordProcess.ActionID -> Action
UPDATE "${mjSchema}"."RecordProcess" SET "ActionID" = NULL WHERE "ActionID" IN (
  '5044A100-0001-4000-8000-000000000001',
  '5044A100-0002-4000-8000-000000000002',
  '5044A100-0003-4000-8000-000000000003',
  '5044A100-0005-4000-8000-000000000005',
  '5044A100-0008-4000-8000-000000000008',
  '5044A100-0009-4000-8000-000000000009',
  '5044A100-000A-4000-8000-00000000000A',
  '5044A100-000B-4000-8000-00000000000B',
  '5044A100-000C-4000-8000-000000000008',
  '5044A100-000D-4000-8000-000000000009',
  '5044A100-000E-4000-8000-00000000000E',
  '5044A100-000F-4000-8000-00000000000F',
  '5044A100-0010-4000-8000-000000000010',
  '5044A100-0011-4000-8000-000000000011',
  '5044A100-0012-4000-8000-000000000012',
  '5044A100-0013-4000-8000-000000000013',
  '5044A100-0014-4000-8000-000000000014',
  '5044A100-0015-4000-8000-000000000015',
  '5044A100-0016-4000-8000-000000000016',
  '5044A100-0017-4000-8000-000000000017',
  '5044A100-0018-4000-8000-000000000018',
  '5044A100-0019-4000-8000-000000000019',
  '5044A100-001A-4000-8000-00000000001A',
  '5044A100-001B-4000-8000-00000000001B'
);

-- MCPServerTool.GeneratedActionID -> Action
UPDATE "${mjSchema}"."MCPServerTool" SET "GeneratedActionID" = NULL WHERE "GeneratedActionID" IN (
  '5044A100-0001-4000-8000-000000000001',
  '5044A100-0002-4000-8000-000000000002',
  '5044A100-0003-4000-8000-000000000003',
  '5044A100-0005-4000-8000-000000000005',
  '5044A100-0008-4000-8000-000000000008',
  '5044A100-0009-4000-8000-000000000009',
  '5044A100-000A-4000-8000-00000000000A',
  '5044A100-000B-4000-8000-00000000000B',
  '5044A100-000C-4000-8000-000000000008',
  '5044A100-000D-4000-8000-000000000009',
  '5044A100-000E-4000-8000-00000000000E',
  '5044A100-000F-4000-8000-00000000000F',
  '5044A100-0010-4000-8000-000000000010',
  '5044A100-0011-4000-8000-000000000011',
  '5044A100-0012-4000-8000-000000000012',
  '5044A100-0013-4000-8000-000000000013',
  '5044A100-0014-4000-8000-000000000014',
  '5044A100-0015-4000-8000-000000000015',
  '5044A100-0016-4000-8000-000000000016',
  '5044A100-0017-4000-8000-000000000017',
  '5044A100-0018-4000-8000-000000000018',
  '5044A100-0019-4000-8000-000000000019',
  '5044A100-001A-4000-8000-00000000001A',
  '5044A100-001B-4000-8000-00000000001B'
);

-- AIAgentAction.ActionID -> Action
UPDATE "${mjSchema}"."AIAgentAction" SET "ActionID" = NULL WHERE "ActionID" IN (
  '5044A100-0001-4000-8000-000000000001',
  '5044A100-0002-4000-8000-000000000002',
  '5044A100-0003-4000-8000-000000000003',
  '5044A100-0005-4000-8000-000000000005',
  '5044A100-0008-4000-8000-000000000008',
  '5044A100-0009-4000-8000-000000000009',
  '5044A100-000A-4000-8000-00000000000A',
  '5044A100-000B-4000-8000-00000000000B',
  '5044A100-000C-4000-8000-000000000008',
  '5044A100-000D-4000-8000-000000000009',
  '5044A100-000E-4000-8000-00000000000E',
  '5044A100-000F-4000-8000-00000000000F',
  '5044A100-0010-4000-8000-000000000010',
  '5044A100-0011-4000-8000-000000000011',
  '5044A100-0012-4000-8000-000000000012',
  '5044A100-0013-4000-8000-000000000013',
  '5044A100-0014-4000-8000-000000000014',
  '5044A100-0015-4000-8000-000000000015',
  '5044A100-0016-4000-8000-000000000016',
  '5044A100-0017-4000-8000-000000000017',
  '5044A100-0018-4000-8000-000000000018',
  '5044A100-0019-4000-8000-000000000019',
  '5044A100-001A-4000-8000-00000000001A',
  '5044A100-001B-4000-8000-00000000001B'
);

-- AIAgentStep.SubAgentID -> AIAgent
UPDATE "${mjSchema}"."AIAgentStep" SET "SubAgentID" = NULL WHERE "SubAgentID" IN (
  'CF1D58BA-451E-4515-89BD-AC3F16A19534'
);

-- AIAgentSession.LastSessionID -> AIAgentSession
UPDATE "${mjSchema}"."AIAgentSession" SET "LastSessionID" = NULL WHERE "LastSessionID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIAgentSession" WHERE "AgentID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIAgent" WHERE "ID" IN (
      'CF1D58BA-451E-4515-89BD-AC3F16A19534'
    )
  )
);

-- SearchExecutionLog.AIAgentID -> AIAgent
UPDATE "${mjSchema}"."SearchExecutionLog" SET "AIAgentID" = NULL WHERE "AIAgentID" IN (
  'CF1D58BA-451E-4515-89BD-AC3F16A19534'
);

-- RecordProcess.AgentID -> AIAgent
UPDATE "${mjSchema}"."RecordProcess" SET "AgentID" = NULL WHERE "AgentID" IN (
  'CF1D58BA-451E-4515-89BD-AC3F16A19534'
);

-- AIAgentCoAgent.TargetAgentID -> AIAgent
UPDATE "${mjSchema}"."AIAgentCoAgent" SET "TargetAgentID" = NULL WHERE "TargetAgentID" IN (
  'CF1D58BA-451E-4515-89BD-AC3F16A19534'
);

-- AIPromptRun.AgentID -> AIAgent
UPDATE "${mjSchema}"."AIPromptRun" SET "AgentID" = NULL WHERE "AgentID" IN (
  'CF1D58BA-451E-4515-89BD-AC3F16A19534'
);

-- Action.CreatedByAgentID -> AIAgent
UPDATE "${mjSchema}"."Action" SET "CreatedByAgentID" = NULL WHERE "CreatedByAgentID" IN (
  'CF1D58BA-451E-4515-89BD-AC3F16A19534'
);

-- EntityDocument.ReasoningAgentID -> AIAgent
UPDATE "${mjSchema}"."EntityDocument" SET "ReasoningAgentID" = NULL WHERE "ReasoningAgentID" IN (
  'CF1D58BA-451E-4515-89BD-AC3F16A19534'
);

-- AIResultCache.AgentID -> AIAgent
UPDATE "${mjSchema}"."AIResultCache" SET "AgentID" = NULL WHERE "AgentID" IN (
  'CF1D58BA-451E-4515-89BD-AC3F16A19534'
);

-- Task.AgentID -> AIAgent
UPDATE "${mjSchema}"."Task" SET "AgentID" = NULL WHERE "AgentID" IN (
  'CF1D58BA-451E-4515-89BD-AC3F16A19534'
);

-- AIAgentAction.AgentID -> AIAgent
UPDATE "${mjSchema}"."AIAgentAction" SET "AgentID" = NULL WHERE "AgentID" IN (
  'CF1D58BA-451E-4515-89BD-AC3F16A19534'
);

-- Conversation.DefaultAgentID -> AIAgent
UPDATE "${mjSchema}"."Conversation" SET "DefaultAgentID" = NULL WHERE "DefaultAgentID" IN (
  'CF1D58BA-451E-4515-89BD-AC3F16A19534'
);

-- ConversationDetail.AgentID -> AIAgent
UPDATE "${mjSchema}"."ConversationDetail" SET "AgentID" = NULL WHERE "AgentID" IN (
  'CF1D58BA-451E-4515-89BD-AC3F16A19534'
);

-- AIAgentModel.AgentID -> AIAgent
UPDATE "${mjSchema}"."AIAgentModel" SET "AgentID" = NULL WHERE "AgentID" IN (
  'CF1D58BA-451E-4515-89BD-AC3F16A19534'
);

-- AIAgentNote.AgentID -> AIAgent
UPDATE "${mjSchema}"."AIAgentNote" SET "AgentID" = NULL WHERE "AgentID" IN (
  'CF1D58BA-451E-4515-89BD-AC3F16A19534'
);

-- AIAgentRun.ParentRunID -> AIAgentRun
UPDATE "${mjSchema}"."AIAgentRun" SET "ParentRunID" = NULL WHERE "ParentRunID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIAgentRun" WHERE "AgentID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIAgent" WHERE "ID" IN (
      'CF1D58BA-451E-4515-89BD-AC3F16A19534'
    )
  )
);

-- AIAgentRun.LastRunID -> AIAgentRun
UPDATE "${mjSchema}"."AIAgentRun" SET "LastRunID" = NULL WHERE "LastRunID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIAgentRun" WHERE "AgentID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIAgent" WHERE "ID" IN (
      'CF1D58BA-451E-4515-89BD-AC3F16A19534'
    )
  )
);

-- AIAgentStep.PromptID -> AIPrompt
UPDATE "${mjSchema}"."AIAgentStep" SET "PromptID" = NULL WHERE "PromptID" IN (
  '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
);

-- AIAgentType.SystemPromptID -> AIPrompt
UPDATE "${mjSchema}"."AIAgentType" SET "SystemPromptID" = NULL WHERE "SystemPromptID" IN (
  '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
);

-- AIConfiguration.DefaultPromptForContextCompressionID -> AIPrompt
UPDATE "${mjSchema}"."AIConfiguration" SET "DefaultPromptForContextCompressionID" = NULL WHERE "DefaultPromptForContextCompressionID" IN (
  '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
);

-- AIConfiguration.DefaultPromptForContextSummarizationID -> AIPrompt
UPDATE "${mjSchema}"."AIConfiguration" SET "DefaultPromptForContextSummarizationID" = NULL WHERE "DefaultPromptForContextSummarizationID" IN (
  '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
);

-- RecordProcess.PromptID -> AIPrompt
UPDATE "${mjSchema}"."RecordProcess" SET "PromptID" = NULL WHERE "PromptID" IN (
  '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
);

-- AIPromptRun.ParentID -> AIPromptRun
UPDATE "${mjSchema}"."AIPromptRun" SET "ParentID" = NULL WHERE "ParentID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIPromptRun" WHERE "PromptID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIPrompt" WHERE "ID" IN (
      '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
    )
  )
);

-- AIPromptRun.RerunFromPromptRunID -> AIPromptRun
UPDATE "${mjSchema}"."AIPromptRun" SET "RerunFromPromptRunID" = NULL WHERE "RerunFromPromptRunID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIPromptRun" WHERE "PromptID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIPrompt" WHERE "ID" IN (
      '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
    )
  )
);

-- AIPromptRun.JudgeID -> AIPrompt
UPDATE "${mjSchema}"."AIPromptRun" SET "JudgeID" = NULL WHERE "JudgeID" IN (
  '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
);

-- AIPromptRun.ChildPromptID -> AIPrompt
UPDATE "${mjSchema}"."AIPromptRun" SET "ChildPromptID" = NULL WHERE "ChildPromptID" IN (
  '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
);

-- Action.DefaultCompactPromptID -> AIPrompt
UPDATE "${mjSchema}"."Action" SET "DefaultCompactPromptID" = NULL WHERE "DefaultCompactPromptID" IN (
  '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
);

-- EntityDocument.ReasoningPromptID -> AIPrompt
UPDATE "${mjSchema}"."EntityDocument" SET "ReasoningPromptID" = NULL WHERE "ReasoningPromptID" IN (
  '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
);

-- AIAgent.ContextCompressionPromptID -> AIPrompt
UPDATE "${mjSchema}"."AIAgent" SET "ContextCompressionPromptID" = NULL WHERE "ContextCompressionPromptID" IN (
  '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
);

-- AIAgentAction.CompactPromptID -> AIPrompt
UPDATE "${mjSchema}"."AIAgentAction" SET "CompactPromptID" = NULL WHERE "CompactPromptID" IN (
  '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
);

-- DataContextItem.QueryID -> Query
UPDATE "${mjSchema}"."DataContextItem" SET "QueryID" = NULL WHERE "QueryID" IN (
  '5044A100-0020-4000-8000-000000000001',
  '5044A100-0020-4000-8000-000000000002',
  '5044A100-0020-4000-8000-000000000003'
);

-- AIAgentSearchScope.QueryTemplateID -> Template
UPDATE "${mjSchema}"."AIAgentSearchScope" SET "QueryTemplateID" = NULL WHERE "QueryTemplateID" IN (
  '40F49DD4-0712-4263-8785-5346F023FFA1'
);

-- UserNotificationType.EmailTemplateID -> Template
UPDATE "${mjSchema}"."UserNotificationType" SET "EmailTemplateID" = NULL WHERE "EmailTemplateID" IN (
  '40F49DD4-0712-4263-8785-5346F023FFA1'
);

-- UserNotificationType.SMSTemplateID -> Template
UPDATE "${mjSchema}"."UserNotificationType" SET "SMSTemplateID" = NULL WHERE "SMSTemplateID" IN (
  '40F49DD4-0712-4263-8785-5346F023FFA1'
);

-- SearchScopeProvider.QueryTransformTemplateID -> Template
UPDATE "${mjSchema}"."SearchScopeProvider" SET "QueryTransformTemplateID" = NULL WHERE "QueryTransformTemplateID" IN (
  '40F49DD4-0712-4263-8785-5346F023FFA1'
);

-- AIPrompt.ResultSelectorPromptID -> AIPrompt
UPDATE "${mjSchema}"."AIPrompt" SET "ResultSelectorPromptID" = NULL WHERE "ResultSelectorPromptID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIPrompt" WHERE "TemplateID" IN (
    SELECT "ID" FROM "${mjSchema}"."Template" WHERE "ID" IN (
      '40F49DD4-0712-4263-8785-5346F023FFA1'
    )
  )
);

-- UserRoutine.NotificationTemplateID -> Template
UPDATE "${mjSchema}"."UserRoutine" SET "NotificationTemplateID" = NULL WHERE "NotificationTemplateID" IN (
  '40F49DD4-0712-4263-8785-5346F023FFA1'
);

-- TemplateParam.TemplateContentID -> TemplateContent
UPDATE "${mjSchema}"."TemplateParam" SET "TemplateContentID" = NULL WHERE "TemplateContentID" IN (
  '094E9B12-2F3E-46EC-A9E6-D4D026F96298'
);

-- ContentSource.ScheduledActionID -> ScheduledAction
UPDATE "${mjSchema}"."ContentSource" SET "ScheduledActionID" = NULL WHERE "ScheduledActionID" IN (
  SELECT "ID" FROM "${mjSchema}"."ScheduledAction" WHERE "ActionID" IN (
    SELECT "ID" FROM "${mjSchema}"."Action" WHERE "ID" IN (
      '5044A100-0001-4000-8000-000000000001',
      '5044A100-0002-4000-8000-000000000002',
      '5044A100-0003-4000-8000-000000000003',
      '5044A100-0005-4000-8000-000000000005',
      '5044A100-0008-4000-8000-000000000008',
      '5044A100-0009-4000-8000-000000000009',
      '5044A100-000A-4000-8000-00000000000A',
      '5044A100-000B-4000-8000-00000000000B',
      '5044A100-000C-4000-8000-000000000008',
      '5044A100-000D-4000-8000-000000000009',
      '5044A100-000E-4000-8000-00000000000E',
      '5044A100-000F-4000-8000-00000000000F',
      '5044A100-0010-4000-8000-000000000010',
      '5044A100-0011-4000-8000-000000000011',
      '5044A100-0012-4000-8000-000000000012',
      '5044A100-0013-4000-8000-000000000013',
      '5044A100-0014-4000-8000-000000000014',
      '5044A100-0015-4000-8000-000000000015',
      '5044A100-0016-4000-8000-000000000016',
      '5044A100-0017-4000-8000-000000000017',
      '5044A100-0018-4000-8000-000000000018',
      '5044A100-0019-4000-8000-000000000019',
      '5044A100-001A-4000-8000-00000000001A',
      '5044A100-001B-4000-8000-00000000001B'
    )
  )
);

-- ProcessRunDetail.ActionExecutionLogID -> ActionExecutionLog
UPDATE "${mjSchema}"."ProcessRunDetail" SET "ActionExecutionLogID" = NULL WHERE "ActionExecutionLogID" IN (
  SELECT "ID" FROM "${mjSchema}"."ActionExecutionLog" WHERE "ActionID" IN (
    SELECT "ID" FROM "${mjSchema}"."Action" WHERE "ID" IN (
      '5044A100-0001-4000-8000-000000000001',
      '5044A100-0002-4000-8000-000000000002',
      '5044A100-0003-4000-8000-000000000003',
      '5044A100-0005-4000-8000-000000000005',
      '5044A100-0008-4000-8000-000000000008',
      '5044A100-0009-4000-8000-000000000009',
      '5044A100-000A-4000-8000-00000000000A',
      '5044A100-000B-4000-8000-00000000000B',
      '5044A100-000C-4000-8000-000000000008',
      '5044A100-000D-4000-8000-000000000009',
      '5044A100-000E-4000-8000-00000000000E',
      '5044A100-000F-4000-8000-00000000000F',
      '5044A100-0010-4000-8000-000000000010',
      '5044A100-0011-4000-8000-000000000011',
      '5044A100-0012-4000-8000-000000000012',
      '5044A100-0013-4000-8000-000000000013',
      '5044A100-0014-4000-8000-000000000014',
      '5044A100-0015-4000-8000-000000000015',
      '5044A100-0016-4000-8000-000000000016',
      '5044A100-0017-4000-8000-000000000017',
      '5044A100-0018-4000-8000-000000000018',
      '5044A100-0019-4000-8000-000000000019',
      '5044A100-001A-4000-8000-00000000001A',
      '5044A100-001B-4000-8000-00000000001B'
    )
  )
);

-- UserRoutineRun.ActionExecutionLogID -> ActionExecutionLog
UPDATE "${mjSchema}"."UserRoutineRun" SET "ActionExecutionLogID" = NULL WHERE "ActionExecutionLogID" IN (
  SELECT "ID" FROM "${mjSchema}"."ActionExecutionLog" WHERE "ActionID" IN (
    SELECT "ID" FROM "${mjSchema}"."Action" WHERE "ID" IN (
      '5044A100-0001-4000-8000-000000000001',
      '5044A100-0002-4000-8000-000000000002',
      '5044A100-0003-4000-8000-000000000003',
      '5044A100-0005-4000-8000-000000000005',
      '5044A100-0008-4000-8000-000000000008',
      '5044A100-0009-4000-8000-000000000009',
      '5044A100-000A-4000-8000-00000000000A',
      '5044A100-000B-4000-8000-00000000000B',
      '5044A100-000C-4000-8000-000000000008',
      '5044A100-000D-4000-8000-000000000009',
      '5044A100-000E-4000-8000-00000000000E',
      '5044A100-000F-4000-8000-00000000000F',
      '5044A100-0010-4000-8000-000000000010',
      '5044A100-0011-4000-8000-000000000011',
      '5044A100-0012-4000-8000-000000000012',
      '5044A100-0013-4000-8000-000000000013',
      '5044A100-0014-4000-8000-000000000014',
      '5044A100-0015-4000-8000-000000000015',
      '5044A100-0016-4000-8000-000000000016',
      '5044A100-0017-4000-8000-000000000017',
      '5044A100-0018-4000-8000-000000000018',
      '5044A100-0019-4000-8000-000000000019',
      '5044A100-001A-4000-8000-00000000001A',
      '5044A100-001B-4000-8000-00000000001B'
    )
  )
);

-- ConversationDetail.AgentSessionID -> AIAgentSession
UPDATE "${mjSchema}"."ConversationDetail" SET "AgentSessionID" = NULL WHERE "AgentSessionID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIAgentSession" WHERE "AgentID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIAgent" WHERE "ID" IN (
      'CF1D58BA-451E-4515-89BD-AC3F16A19534'
    )
  )
);

-- AIAgentRun.AgentSessionID -> AIAgentSession
UPDATE "${mjSchema}"."AIAgentRun" SET "AgentSessionID" = NULL WHERE "AgentSessionID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIAgentSession" WHERE "AgentID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIAgent" WHERE "ID" IN (
      'CF1D58BA-451E-4515-89BD-AC3F16A19534'
    )
  )
);

-- AIAgentRunStep.ParentID -> AIAgentRunStep
UPDATE "${mjSchema}"."AIAgentRunStep" SET "ParentID" = NULL WHERE "ParentID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIAgentRunStep" WHERE "AgentRunID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIAgentRun" WHERE "AgentID" IN (
      SELECT "ID" FROM "${mjSchema}"."AIAgent" WHERE "ID" IN (
        'CF1D58BA-451E-4515-89BD-AC3F16A19534'
      )
    )
  )
);

-- DuplicateRunDetailMatch.AIAgentRunID -> AIAgentRun
UPDATE "${mjSchema}"."DuplicateRunDetailMatch" SET "AIAgentRunID" = NULL WHERE "AIAgentRunID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIAgentRun" WHERE "AgentID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIAgent" WHERE "ID" IN (
      'CF1D58BA-451E-4515-89BD-AC3F16A19534'
    )
  )
);

-- ExperimentSession.AgentRunID -> AIAgentRun
UPDATE "${mjSchema}"."ExperimentSession" SET "AgentRunID" = NULL WHERE "AgentRunID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIAgentRun" WHERE "AgentID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIAgent" WHERE "ID" IN (
      'CF1D58BA-451E-4515-89BD-AC3F16A19534'
    )
  )
);

-- ExperimentSessionIteration.AIAgentRunID -> AIAgentRun
UPDATE "${mjSchema}"."ExperimentSessionIteration" SET "AIAgentRunID" = NULL WHERE "AIAgentRunID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIAgentRun" WHERE "AgentID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIAgent" WHERE "ID" IN (
      'CF1D58BA-451E-4515-89BD-AC3F16A19534'
    )
  )
);

-- AIPromptRun.AgentRunID -> AIAgentRun
UPDATE "${mjSchema}"."AIPromptRun" SET "AgentRunID" = NULL WHERE "AgentRunID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIAgentRun" WHERE "AgentID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIAgent" WHERE "ID" IN (
      'CF1D58BA-451E-4515-89BD-AC3F16A19534'
    )
  )
);

-- ProcessRunDetail.AIAgentRunID -> AIAgentRun
UPDATE "${mjSchema}"."ProcessRunDetail" SET "AIAgentRunID" = NULL WHERE "AIAgentRunID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIAgentRun" WHERE "AgentID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIAgent" WHERE "ID" IN (
      'CF1D58BA-451E-4515-89BD-AC3F16A19534'
    )
  )
);

-- UserRoutineRun.AgentRunID -> AIAgentRun
UPDATE "${mjSchema}"."UserRoutineRun" SET "AgentRunID" = NULL WHERE "AgentRunID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIAgentRun" WHERE "AgentID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIAgent" WHERE "ID" IN (
      'CF1D58BA-451E-4515-89BD-AC3F16A19534'
    )
  )
);

-- AIAgentExample.SourceAIAgentRunID -> AIAgentRun
UPDATE "${mjSchema}"."AIAgentExample" SET "SourceAIAgentRunID" = NULL WHERE "SourceAIAgentRunID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIAgentRun" WHERE "AgentID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIAgent" WHERE "ID" IN (
      'CF1D58BA-451E-4515-89BD-AC3F16A19534'
    )
  )
);

-- AIAgentNote.SourceAIAgentRunID -> AIAgentRun
UPDATE "${mjSchema}"."AIAgentNote" SET "SourceAIAgentRunID" = NULL WHERE "SourceAIAgentRunID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIAgentRun" WHERE "AgentID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIAgent" WHERE "ID" IN (
      'CF1D58BA-451E-4515-89BD-AC3F16A19534'
    )
  )
);

-- AIAgentRequest.OriginatingAgentRunID -> AIAgentRun
UPDATE "${mjSchema}"."AIAgentRequest" SET "OriginatingAgentRunID" = NULL WHERE "OriginatingAgentRunID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIAgentRun" WHERE "AgentID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIAgent" WHERE "ID" IN (
      'CF1D58BA-451E-4515-89BD-AC3F16A19534'
    )
  )
);

-- AIAgentRequest.ResumingAgentRunID -> AIAgentRun
UPDATE "${mjSchema}"."AIAgentRequest" SET "ResumingAgentRunID" = NULL WHERE "ResumingAgentRunID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIAgentRun" WHERE "AgentID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIAgent" WHERE "ID" IN (
      'CF1D58BA-451E-4515-89BD-AC3F16A19534'
    )
  )
);

-- AICredentialBinding.AIPromptModelID -> AIPromptModel
UPDATE "${mjSchema}"."AICredentialBinding" SET "AIPromptModelID" = NULL WHERE "AIPromptModelID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIPromptModel" WHERE "PromptID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIPrompt" WHERE "ID" IN (
      '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
    )
  )
);

-- DuplicateRunDetailMatch.AIPromptRunID -> AIPromptRun
UPDATE "${mjSchema}"."DuplicateRunDetailMatch" SET "AIPromptRunID" = NULL WHERE "AIPromptRunID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIPromptRun" WHERE "PromptID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIPrompt" WHERE "ID" IN (
      '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
    )
  )
);

-- AIResultCache.PromptRunID -> AIPromptRun
UPDATE "${mjSchema}"."AIResultCache" SET "PromptRunID" = NULL WHERE "PromptRunID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIPromptRun" WHERE "PromptID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIPrompt" WHERE "ID" IN (
      '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
    )
  )
);

-- ContentItemTag.AIPromptRunID -> AIPromptRun
UPDATE "${mjSchema}"."ContentItemTag" SET "AIPromptRunID" = NULL WHERE "AIPromptRunID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIPromptRun" WHERE "PromptID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIPrompt" WHERE "ID" IN (
      '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
    )
  )
);

-- UserRoutineRun.PromptRunID -> AIPromptRun
UPDATE "${mjSchema}"."UserRoutineRun" SET "PromptRunID" = NULL WHERE "PromptRunID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIPromptRun" WHERE "PromptID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIPrompt" WHERE "ID" IN (
      '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
    )
  )
);

-- ContentSource.EntityDocumentID -> EntityDocument
UPDATE "${mjSchema}"."ContentSource" SET "EntityDocumentID" = NULL WHERE "EntityDocumentID" IN (
  SELECT "ID" FROM "${mjSchema}"."EntityDocument" WHERE "TemplateID" IN (
    SELECT "ID" FROM "${mjSchema}"."Template" WHERE "ID" IN (
      '40F49DD4-0712-4263-8785-5346F023FFA1'
    )
  )
);

-- AIAgentRequest.OriginatingAgentRunStepID -> AIAgentRunStep
UPDATE "${mjSchema}"."AIAgentRequest" SET "OriginatingAgentRunStepID" = NULL WHERE "OriginatingAgentRunStepID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIAgentRunStep" WHERE "AgentRunID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIAgentRun" WHERE "AgentID" IN (
      SELECT "ID" FROM "${mjSchema}"."AIAgent" WHERE "ID" IN (
        'CF1D58BA-451E-4515-89BD-AC3F16A19534'
      )
    )
  )
);

-- AIAgentRunMedia.SourcePromptRunMediaID -> AIPromptRunMedia
UPDATE "${mjSchema}"."AIAgentRunMedia" SET "SourcePromptRunMediaID" = NULL WHERE "SourcePromptRunMediaID" IN (
  SELECT "ID" FROM "${mjSchema}"."AIPromptRunMedia" WHERE "PromptRunID" IN (
    SELECT "ID" FROM "${mjSchema}"."AIPromptRun" WHERE "PromptID" IN (
      SELECT "ID" FROM "${mjSchema}"."AIPrompt" WHERE "ID" IN (
        '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
      )
    )
  )
);

-- ContentItem.EntityRecordDocumentID -> EntityRecordDocument
UPDATE "${mjSchema}"."ContentItem" SET "EntityRecordDocumentID" = NULL WHERE "EntityRecordDocumentID" IN (
  SELECT "ID" FROM "${mjSchema}"."EntityRecordDocument" WHERE "EntityDocumentID" IN (
    SELECT "ID" FROM "${mjSchema}"."EntityDocument" WHERE "TemplateID" IN (
      SELECT "ID" FROM "${mjSchema}"."Template" WHERE "ID" IN (
        '40F49DD4-0712-4263-8785-5346F023FFA1'
      )
    )
  )
);
