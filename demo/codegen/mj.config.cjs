/** @type {import('@memberjunction/config').MJConfig} */
// =============================================================================
// SANDBOX CodeGen config (DEMO ONLY) — a copy of the root mj.config.cjs with the
// sandbox-hostile bits disabled, so registering the `membership` demo entities never
// touches source or the main migration line:
//   - commands: []        → no package rebuilds, no second MJAPI on :4102
//   - SQLOutput.enabled    → false; no generated DDL written into ./migrations/codegen/
//
// Use against the sandbox DB only (DB_DATABASE=Sonar_Demo). Run with `npm run mj:codegen:demo`
// (which loads demo/.env.demo). Paths below mirror the root config so file outputs would land
// in the right place IF ever run without --skipfiles — but the demo flow always uses --skipfiles.
// =============================================================================
module.exports = {
  entityPackageName: '@mj-biz-apps/sonar-entities',

  output: [
    { type: 'SQL', directory: './SQL Scripts/generated', appendOutputCode: true },
    { type: 'Angular', directory: './packages/Angular/src/lib/generated', options: [{ name: 'maxComponentsPerModule', value: 20 }] },
    { type: 'GraphQLServer', directory: './packages/Server/src/generated' },
    { type: 'ActionSubclasses', directory: './packages/Actions/src/generated' },
    { type: 'EntitySubclasses', directory: './packages/Entities/src/generated' },
    { type: 'DBSchemaJSON', directory: './Schema Files' },
  ],

  // Sandbox: no post-codegen hooks (the root config rebuilds packages + starts MJAPI).
  commands: [],

  newEntityDefaults: {
    NameRulesBySchema: [
      { SchemaName: '${mj_core_schema}', EntityNamePrefix: 'MJ: ' },
      { SchemaName: '__mj_BizAppsSonar', EntityNamePrefix: 'MJ_BizApps_Sonar: ', EntityNameSuffix: '' },
    ],
  },

  excludeSchemas: ['sys', 'staging', 'dbo', '__mj'],

  // Sandbox: do NOT emit generated DDL into the repo's migration line.
  SQLOutput: {
    enabled: false,
    folderPath: './migrations/codegen/',
    appendToFile: false,
    convertCoreSchemaToFlywayMigrationFile: true,
    omitRecurringScriptsFromLog: false,
    schemaPlaceholders: [
      { schema: '__mj_BizAppsSonar', placeholder: '${flyway:defaultSchema}' },
      { schema: '__mj', placeholder: '${mjSchema}' },
    ],
  },
};
