#!/usr/bin/env node
/**
 * Records the metadata content hashes that the current seed migration was generated from.
 *
 * Run this — and ONLY this — immediately after regenerating `migrations/*Metadata_Sync*.sql`.
 * Running it to silence `npm run lint:distribution` without regenerating the seed defeats the
 * gate entirely: it would assert that metadata ships which does not.
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildManifest } from './check-distribution-seed.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(REPO_ROOT, 'migrations', 'metadata-seed.manifest.json');

const manifest = buildManifest();
writeFileSync(target, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote ${Object.keys(manifest.files).length} metadata hashes to migrations/metadata-seed.manifest.json`);
