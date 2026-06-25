/**
 * Sonar Server Bootstrap
 *
 * Server-side bootstrap package for the Sonar Open App.
 * Ensures all entity subclasses, action subclasses, and GraphQL resolvers
 * are registered with the MJ class factory.
 */

// Import entity and action packages to trigger @RegisterClass decorators
import '@mj-biz-apps/sonar-entities';
import '@mj-biz-apps/sonar-actions';

// Load MJ's built-in (core) actions so their CLASSES register — the action-layer interventions
// fire real ones (Slack Webhook, Teams Webhook, HTTP Request, Send Single Message). Their metadata
// rows exist in the catalog, but ActionEngineServer can't RUN them without the implementing class
// loaded here (otherwise: "Could not find a class for action Slack Webhook").
import '@memberjunction/core-actions';

// Server-side entity subclasses — must come after common-entities so
// @RegisterClass auto-increment gives these higher priority
import '@mj-biz-apps/sonar-core-entities-server';

// Import generated GraphQL resolvers
import './generated/generated.js';

// Import generated class registrations manifest
import { CLASS_REGISTRATIONS } from './generated/class-registrations-manifest.js';

// Re-export the manifest for consumers
export { CLASS_REGISTRATIONS } from './generated/class-registrations-manifest.js';

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** Absolute paths to the generated resolver files, for use with createMJServer() */
export const RESOLVER_PATHS = [resolve(__dirname, 'generated/generated.{js,ts}')];

/**
 * Bootstrap function called by DynamicPackageLoader during MJAPI startup.
 * The static imports above handle all registration; this function ensures
 * the module is fully evaluated.
 */
export function LoadSonarServer(): void {
    // Static imports above ensure all classes are registered.
    // This function exists as the startupExport entry point for DynamicPackageLoader.
}
