# Cutting a release

Sonar publishes its six `@mj-biz-apps/sonar-*` packages with the open-app release pipeline shared
across the BizApps repos. `build.yml`, `changes.yml`, `release-readiness.yml`, `version.yml`,
`publish.yml` and their scripts in `.github/scripts/` and `ci/` are copied byte-for-byte from
**bizapps-issues** and must stay identical; change them there, not here. Checks specific to Sonar
live in `.github/workflows/repo-checks.yml`. `distribution-gate.yml` and
`verify-release-app-token.yml` are Sonar's own.

```
feature branch ──PR──▶ next ──(App opens Version Packages PR)──▶ main ──(publish.yml)──▶ npm
```

| Step | Who | What |
|---|---|---|
| 0. Prep the seed | you, once per release | the consolidated `Metadata_Sync` and its PG twin: needs a database, so no workflow can do it |
| 1. Version Packages PR | `version.yml` | refreshed on every push to `next`; you never open it |
| 2. Review and merge it | you | merging it **is** the release; the `rr:` checks gate it |
| 3. Publish | `publish.yml` | publishes to npm over OIDC, tags `vX.Y.Z`, opens and merges the back-merge into `next` |

Nothing in the release path pushes to `main` or `next` (`pnpm run lint:release-pushes`, run by
`repo: guards`, fails any workflow or script that tries).

## Changesets

Every PR that changes shipped behaviour carries a changeset (`pnpm run change`). The release
version is computed from them; it is never typed in.

- **`patch`** by default; **`minor`** when the PR changes `migrations/` or `metadata/`. The
  `migration changeset` check enforces it at the door, and `rr: minor bump` enforces it again for
  the release as a whole.
- All `@mj-biz-apps/*` packages version together (a `fixed` group in `.changeset/config.json`).
- `mj-app.json`'s `version` and `mjVersionRange` are written by `pnpm run version:prepare`
  (`ci/sync-mj-app-version.mjs`) inside the Version Packages PR. `mjVersionRange` is derived from
  `packages/Entities`' `@memberjunction/core` dependency, so raise that dependency when Sonar needs a
  newer MJ host, not just the manifest.

## 0. Prep: the metadata seed

The one part no workflow does for you. A PR that changes metadata carries the JSON only; generating
the consolidated `Metadata_Sync` needs a database with MJ core installed. Follow
[`migrations/README.md`](../migrations/README.md#regenerating-the-metadata-seed), including the
PostgreSQL twin (`pnpm run mj:migrate:convert`), and ship it as an ordinary PR into `next` with a
`minor` changeset.

You'll know a seed is owed when the Version Packages PR shows `rr: metadata shipped` red
(metadata changed since the last tag, but no `Metadata_Sync` migration was added), or
`repo: release seed` red (`check:release-seed` / `check:seed-cadence`).

## 1–2. The Version Packages PR

Every push to `next` refreshes one PR, `changeset-release/main` → `main`, opened by the
`blue-cypress-ci-bot` App. It runs `pnpm run version:prepare` (`changeset version`, the
`mj-app.json` sync and a lockfile refresh). Review the computed version and the CHANGELOGs there.

It needs these to be green before it can merge: `rr: changesets`, `rr: minor bump`,
`rr: metadata shipped`, `rr: pg counterparts`, `rr: release base current`,
`rr: migration immutability`, `rr: packages on npm`, `build`, and `repo: release seed`.
**Merging it is the release.**

## 3. Publishing happens by itself

The merge pushes to `main` and runs `publish.yml`: it builds, publishes to npm, tags `vX.Y.Z`, then
the App opens a `release-back-merge/vX.Y.Z` PR into `next` and merges it. If the back-merge
cannot be opened or merged, the run goes red after the packages are already out and names the PR:
merge it by hand. The next release is blocked (`rr: release base current`) until it lands.
Nothing commits to `main` directly, and there is no hand-opened `next` → `main` PR.

Before a release after a long gap, dispatch **Verify the release App token** (read-only). It
confirms the credential `version.yml` and `publish.yml` depend on.

## One-time admin setup

- **Release App.** `blue-cypress-ci-bot` installed on this repo, with the org `APP_CLIENT_ID`
  variable and `APP_PRIVATE_KEY` secret visible to it. Never make it a bypass actor for direct
  pushes.
- **npm trusted publishing (OIDC).** No `NPM_TOKEN`. Each package's Trusted Publisher on npmjs.com
  names `MemberJunction/bizapps-sonar` and `publish.yml`: `@mj-biz-apps/sonar-actions`,
  `sonar-core-entities-server`, `sonar-engine`, `sonar-entities`, `sonar-ng`, `sonar-server`.
  A brand-new package needs a manual `0.0.0` placeholder before it can be configured.
- **Rulesets**, the same pair as the other open apps:
  - `protect-next` (default branch): PR required; required checks `migration naming`,
    `migration changeset`, `script references`, `Parse migrations (T-SQL syntax check)`, strict;
    the App may bypass for pull requests only.
  - `protect-main`: one approval; required checks the seven `rr:` checks plus `build`.
  - They replace `protect-release-branches`, which has no PR or status-check rules.

## Troubleshooting

| Symptom | Meaning |
|---|---|
| `rr: metadata shipped` red on the Version Packages PR | The seed is owed. Step 0. |
| `rr: minor bump` red | Schema or metadata changed since the last tag, but the pending changesets add up to a patch. Add a `minor` changeset on `next`. |
| A step fails to mint the App token | Dispatch **Verify the release App token**; it names which half is broken. |
| Some packages look unpublished right after a green run | npm's registry read is eventually consistent; wait a few minutes. Trust the publish step's own output over the registry. |
| `publish.yml` red at the back-merge | Everything shipped; only the back-merge is left. Merge the named PR into `next` by hand. |
| A push is refused with `GH013` | Something pushed to `main`/`next`. Run `pnpm run lint:release-pushes` to find it and route the change through a PR. |
