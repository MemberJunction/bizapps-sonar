#!/usr/bin/env node
/**
 * Guard against duplicate hardcoded IDs in the hand-maintained action metadata
 * (metadata/actions/.sonar-actions.json). Every action / param / result-code primaryKey.ID is a
 * fixed GUID in a 4-digit block (5044A100-00NN-...); reusing one makes `mj sync push` fail on a
 * UNIQUE-key violation (a 0008/0009 collision happened once). Run this before syncing, or wire it
 * into CI.  Usage:  node scripts/check-action-ids.cjs   (exit 1 on any duplicate)
 */
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "metadata", "actions", ".sonar-actions.json");
const actions = JSON.parse(fs.readFileSync(file, "utf8"));

/** Collect every primaryKey.ID anywhere in the tree (actions + nested params + result codes). */
const ids = [];
const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (node && typeof node === "object") {
        if (node.primaryKey && typeof node.primaryKey.ID === "string") ids.push(node.primaryKey.ID);
        for (const k of Object.keys(node)) walk(node[k]);
    }
};
walk(actions);

const seen = new Map();
const dups = [];
for (const id of ids) {
    const key = id.toLowerCase();
    if (seen.has(key)) dups.push(id);
    seen.set(key, true);
}

if (dups.length > 0) {
    console.error(`✖ Duplicate action metadata IDs (${dups.length}):`);
    for (const d of [...new Set(dups)]) console.error(`   ${d}`);
    console.error("Pick an unused 4-digit block before adding an action.");
    process.exit(1);
}
console.log(`✓ action metadata IDs unique (${ids.length} checked across ${actions.length} actions).`);
