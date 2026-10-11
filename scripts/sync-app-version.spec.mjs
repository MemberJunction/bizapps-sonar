import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveAppFields, syncAppVersion } from './sync-app-version.mjs';

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('the app version is the entities package version', () => {
    const { version } = deriveAppFields({ version: '0.11.0', dependencies: { '@memberjunction/core': '6.1.0-edge.5' } });
    assert.equal(version, '0.11.0');
});

// The range is ">= the pinned MJ version, < the next MJ major" — the pinning model.
test('the MJ range spans from the pin to the next MJ major', () => {
    const { mjVersionRange } = deriveAppFields({ version: '0.11.0', dependencies: { '@memberjunction/core': '6.1.0-edge.5' } });
    assert.equal(mjVersionRange, '>=6.1.0-edge.5 <7.0.0');
});

test('a caret peer dependency is read when there is no direct dependency', () => {
    const { mjVersionRange } = deriveAppFields({ version: '1.0.0', peerDependencies: { '@memberjunction/core': '^6.1.0' } });
    assert.equal(mjVersionRange, '>=6.1.0 <7.0.0');
});

// Guard clause, not a silent skip: an entities package with no MJ dependency at all means the
// derivation has lost its input, and writing a stale range would be worse than stopping.
test('an entities package with no MJ dependency throws', () => {
    assert.throws(() => deriveAppFields({ version: '1.0.0' }), /@memberjunction\/core/);
});

test('a >= pin keeps its floor and caps at the next major', () => {
    const { mjVersionRange } = deriveAppFields({ version: '1.0.0', dependencies: { '@memberjunction/core': '>=6.1.5' } });
    assert.equal(mjVersionRange, '>=6.1.5 <7.0.0');
});

test('a tilde pin keeps its floor and caps at the next major', () => {
    const { mjVersionRange } = deriveAppFields({ version: '1.0.0', dependencies: { '@memberjunction/core': '~6.1.5' } });
    assert.equal(mjVersionRange, '>=6.1.5 <7.0.0');
});

// A pin with no version in it must stop the derivation, not write `NaN.0.0` (or `>= <1.0.0`, which
// is what an empty string becomes, since Number('') is 0) into the mj-app.json a host installs from.
for (const pin of ['workspace:*', 'latest', '^', '*']) {
    test(`a non-numeric MJ pin (${JSON.stringify(pin)}) throws and names the pin`, () => {
        assert.throws(
            () => deriveAppFields({ version: '1.0.0', dependencies: { '@memberjunction/core': pin } }),
            (error) => error.message.includes(JSON.stringify(pin)) && /@memberjunction\/core/.test(error.message),
        );
    });
}

test('a package with no version throws', () => {
    assert.throws(() => deriveAppFields({ dependencies: { '@memberjunction/core': '6.1.0' } }), /version/);
});

function scratchRepo({ entitiesVersion, mjPin, app }) {
    const root = mkdtempSync(path.join(tmpdir(), 'sync-app-version-'));
    mkdirSync(path.join(root, 'packages', 'Entities'), { recursive: true });
    writeFileSync(
        path.join(root, 'packages', 'Entities', 'package.json'),
        JSON.stringify({ version: entitiesVersion, dependencies: { '@memberjunction/core': mjPin } }, null, 2),
    );
    writeFileSync(path.join(root, 'mj-app.json'), JSON.stringify(app, null, 2) + '\n');
    return root;
}

test('check reports a stale app version', () => {
    const root = scratchRepo({
        entitiesVersion: '0.11.0',
        mjPin: '6.1.0-edge.5',
        app: { version: '0.10.0', mjVersionRange: '>=6.1.0-edge.5 <7.0.0' },
    });
    const mismatches = syncAppVersion({ root, check: true });
    assert.equal(mismatches.length, 1);
    assert.match(mismatches[0], /version/);
});

test('check reports a stale MJ range', () => {
    const root = scratchRepo({
        entitiesVersion: '0.11.0',
        mjPin: '6.1.0-edge.5',
        app: { version: '0.11.0', mjVersionRange: '>=5.0.0 <6.0.0' },
    });
    assert.equal(syncAppVersion({ root, check: true }).length, 1);
});

// The half that matters most: `--check` must not quietly repair what it was asked to inspect.
test('check never writes', () => {
    const root = scratchRepo({
        entitiesVersion: '0.11.0',
        mjPin: '6.1.0-edge.5',
        app: { version: '0.10.0', mjVersionRange: '>=5.0.0 <6.0.0' },
    });
    const before = readFileSync(path.join(root, 'mj-app.json'), 'utf8');
    syncAppVersion({ root, check: true });
    assert.equal(readFileSync(path.join(root, 'mj-app.json'), 'utf8'), before);
});

test('check passes on a synced tree', () => {
    const root = scratchRepo({
        entitiesVersion: '0.11.0',
        mjPin: '6.1.0-edge.5',
        app: { version: '0.11.0', mjVersionRange: '>=6.1.0-edge.5 <7.0.0' },
    });
    assert.deepEqual(syncAppVersion({ root, check: true }), []);
});

test('writing makes a stale tree pass its own check, and preserves other keys', () => {
    const root = scratchRepo({
        entitiesVersion: '0.11.0',
        mjPin: '6.1.0-edge.5',
        app: { name: 'sonar', version: '0.10.0', mjVersionRange: '>=5.0.0 <6.0.0', dependencies: ['common'] },
    });
    assert.deepEqual(syncAppVersion({ root, check: false }), []);
    assert.deepEqual(syncAppVersion({ root, check: true }), []);
    const written = JSON.parse(readFileSync(path.join(root, 'mj-app.json'), 'utf8'));
    assert.equal(written.name, 'sonar');
    assert.deepEqual(written.dependencies, ['common']);
});

// The repository itself must be synced, or the release PR ships an mj-app.json that disagrees
// with the packages it installs.
test('this repository is in sync', () => {
    const mismatches = syncAppVersion({ root: REPO_ROOT, check: true });
    assert.deepEqual(mismatches, [], mismatches.join('\n'));
});
