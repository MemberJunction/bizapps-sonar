# Cutting a release

Two pull requests, and both are opened for you; the second is also merged for you. Nothing in the release path pushes to `main` or
`next` (`pnpm run lint:release-pushes` fails any workflow or script that tries). Adapted from
bizapps-forms' runbook.

| Step | Who | What |
|---|---|---|
| 0. Prep the seed | you, once per release | the consolidated `Metadata_Sync` and its PG twin: needs a database, so no workflow can do it |
| 1. Dispatch **Prepare a release** | you | cuts `release/vX.Y.Z` from `next`, bumps, opens the PR into `main` |
| 2. Review and merge that PR | you | with a **merge commit** |
| 3. Publish | `publish.yml` | builds, publishes to npm, tags, opens the back-merge PR |
| 4. Back-merge | `publish.yml` | merges the back-merge PR into `next` once its checks pass; you step in only if the run goes red |

## Is a release due?

```bash
pnpm run release:plan
```

Read-only (`scripts/release-prep.mjs --plan`), runs on any checkout. It reports the current version,
the pending changesets and the version they compute to, whether `main` has reached `next`, and the
four release gates (`lint:distribution`, `check:release-seed`, `check:seed-cadence`,
`check:pg-parity`), then lists every blocker. The workflow runs the same code.

## Changesets

Every PR that changes shipped behaviour carries a changeset (`pnpm exec changeset`). The release version
is computed from the pending changesets; it is never typed in.

- **`patch`** by default.
- **`minor`** when the change ships a migration or metadata. CI enforces it: `changes.yml` requires a
  `minor` or `major` changeset when `migrations/` or `migrations-pg/` change, and `publish.yml`
  refuses a version that moved only by a patch since the last tag despite migration changes.
- All `@mj-biz-apps/*` packages version together (a `fixed` group in `.changeset/config.json`), so
  the bump level of any one changeset moves every package.
- A changeset with empty frontmatter releases nothing. On its own it is harmless next to a changeset
  that names a level; `release:plan` reports a blocker only when EVERY pending changeset is empty,
  because then there is no version to move to.
- After bumping the MJ pins (`@memberjunction/*`), run `node scripts/sync-app-version.mjs` and commit
  the `mj-app.json` change: its `mjVersionRange` is derived from `packages/Entities`' MJ pin, and
  build-only's spec fails the PR if the two drift.

## 0. Prep: the metadata seed

The one part no workflow does for you. Generating the consolidated `Metadata_Sync` needs a database
with MJ core installed. Follow
[`migrations/README.md`](../migrations/README.md#regenerating-the-metadata-seed), including the
PostgreSQL twin (`pnpm run mj:migrate:convert`). Ship it as an ordinary PR into `next` with a `minor`
changeset.

`pnpm run release:plan` tells you whether a seed is owed: a red `check:release-seed` or
`check:seed-cadence` is a blocker that stops step 1 before anything is written.

Before a release, especially after a gap, dispatch **Verify the release App token** (Actions, then
*Verify the release App token*). It is read-only and confirms the credential steps 1 and 3 depend on.

## 1. Dispatch "Prepare a release"

Actions, then **Prepare a release**, then *Run workflow*. Set `dry_run: true` to see the plan and stop:
no branch, no commit, no PR.

It always works on the tip of `next`, whatever ref you dispatch from. It refuses, before writing
anything, if: the tree is not clean, there are no changesets (or none names a level), any of the four
gates is red, the computed version is already tagged or already on npm, or `main` is not contained in
`next` (the previous release's back-merge PR, `chore/backmerge-v<prev>`, is unmerged).

Otherwise it runs `pnpm run version` (changesets and `sync-app-version.mjs`), updates the lockfile,
commits `Release vX.Y.Z`, pushes `release/vX.Y.Z`, and opens the PR `Release vX.Y.Z` into `main`.
It never force-pushes, and refuses if `release/vX.Y.Z` already exists on the remote.

**The version is not yours to choose.** If it is wrong, the fix is a changeset, not an edit.

> A migration filename's `__v<ver>__` segment is **not** a claim about which release ships it. Flyway
> orders on the `V<timestamp>` prefix and nothing reads the label.

## 2. Review and merge the release PR

This is the one point where a human looks at the seed, the computed version and the CHANGELOGs before
any of it is permanent. The diff against `main` spans everything since the last release, so use
`git diff --name-only origin/next origin/release/vX.Y.Z` to review the bump: it should be the consumed
changesets, the package `package.json` and `CHANGELOG.md` files, the lockfile and `mj-app.json`, and
nothing under `migrations/`, `metadata/` or any `src/`.

Merge it with a **merge commit**.

## 3. Publishing happens by itself

The merge pushes to `main`, which triggers `publish.yml`. It refuses to run from any ref but `main`.
It then validates, builds, tests, runs the release gates, publishes to npm, pushes the `vX.Y.Z` tag
opens the back-merge PR `chore/backmerge-vX.Y.Z` into `next`, and merges it once its checks pass
(step 4). Every gate sits before `Publish to npm`.

**Red before `Publish to npm` means nothing shipped: fix and re-run. Red after it: re-run
`publish.yml` on main to finish.**

**Re-run it to finish a partial release.** `release-plan.mjs` asks two questions separately: is any
package missing this version from npm, and is the `vX.Y.Z` tag absent. Each gates its own step, so a
re-run (dispatch `publish.yml` on `main`) after npm published but the tag is missing, or the tag was
pushed but the back-merge is missing or unmerged, finishes the remainder rather than failing on "already
published". It does nothing, and says so, only when the version is fully published and tagged.

A step before it fails if any `.changeset/*.md` is still present: that means step 1 never ran.

A green run means the automation did its job: published, tagged, and the back-merge PR merged into
`next` (or nothing left to back-merge).

## 4. The back-merge merges by itself

`chore/backmerge-vX.Y.Z` into `next` carries the release merge commit back. `publish.yml` merges it
automatically once its checks pass: it waits up to 40 minutes for the PR's own `pull_request` runs
to register and finish (the push-event checks already on `main`'s tip do not count, though any failing
check stops it), then merges with a **merge commit** through the API, using the App token so the merge starts
`next`'s CI. It never pushes to `next`, and it never squashes or rebases (`release:plan` checks that
`main` is an ancestor of `next`, which only a merge commit achieves).

It merges only when the PR's head is exactly `main`'s tip, the already-reviewed release merge.
`chore/backmerge-*` is not a protected branch, so any other head (a commit pushed to it, including a
human's conflict resolution) turns the run red and is left for a human to review and merge.

If a check fails, the checks do not finish in time, the PR has conflicts, or GitHub refuses the merge,
the run goes red naming the cause and the PR stays open. Then:

- **Nothing was pushed to the branch** (a flaky or timed-out check): re-run the failed checks, then
  re-run `publish.yml` on `main`. It finds the open PR, still at `main`'s tip, waits for its checks
  and merges it.
- **Anything was pushed to the branch** (a conflict resolution or a fix): the head is no longer
  `main`'s tip, so a re-run refuses it. A human reviews the new commits and merges the PR with a
  **merge commit** by hand.

Either way the next release is blocked until it merges. A re-run after the PR has merged has nothing
to do.

Leaving it unmerged costs this release nothing and blocks the next one: `release:plan` refuses to cut
a release while `main` is not contained in `next`, naming this PR, and once the planned `strict: true`
rule lands (admin setup below) GitHub would refuse the next release PR as well.

## Hotfixes

A hotfix goes through `next` and a normal release: land the fix on `next` with a changeset, then
dispatch **Prepare a release** as above. An out-of-band hotfix PR straight to `main` is unsupported
until it is designed: `publish.yml` would fail on the hotfix's leftover changeset (the bump never
ran), or, with no changeset, publish nothing because the version on `main` is already released.

## Known current state

The latest release is 0.6.0. The next release would be 0.7.0 and is blocked until the consolidated
`Metadata_Sync` seed is generated (metadata has changed since v0.6.0, so `check:release-seed` /
`check:seed-cadence` fail). The older open release PR #78 ("Release: bizapps-sonar 0.6.0",
`next` to `main`) predates this process; the recommendation is to close it in favour of a **Prepare a
release** dispatch once the seed is in.

---

## One-time admin setup

**Release GitHub App.** The workflows mint a token with `actions/create-github-app-token@v2`
(`app-id: ${{ vars.APP_CLIENT_ID }}`, `private-key: ${{ secrets.APP_PRIVATE_KEY }}`; v2 has no
`client-id` input, and `app-id` accepts a client ID). Required:

- The App `blue-cypress-ci-bot` installed on `MemberJunction/bizapps-sonar`, with `contents: write`
  and `pull-requests: write`.
- Org variable `APP_CLIENT_ID` and secret `APP_PRIVATE_KEY` visible to this repo.
- Why an App at all: GitHub does not start workflow runs from events authored by `GITHUB_TOKEN`, so
  release branches and PRs it opened would never get CI. Confirm with **Verify the release App token**.

**npm trusted publishing (OIDC).** There is no `NPM_TOKEN`; `publish.yml` has `id-token: write`. On
npmjs.com, each package needs a trusted publisher pointing at `MemberJunction/bizapps-sonar` and
workflow `publish.yml`:

`@mj-biz-apps/sonar-actions`, `sonar-core-entities-server`, `sonar-engine`, `sonar-entities`,
`sonar-ng`, `sonar-server`.

A brand-new package cannot be configured until it exists: publish a `0.0.0` placeholder manually
first, then add its trusted publisher.

**Rulesets.** Today `protect-release-branches` (id 21888843, covering `refs/heads/main` and
`refs/heads/next`) has only `deletion` and `non_fast_forward` rules: no pull-request rule, no required
status checks, and `bypass_actors` is null. So **nothing server-side enforces the PR flow yet**;
`lint:release-pushes` only keeps this repo's own automation honest. To enforce it, add to that ruleset:

- a `pull_request` rule, and
- `required_status_checks` with `strict: true`, naming these job ids:
  `build-only` (build.yml; its helper job `scope` also reports), `changes_and_migrations`
  (changes.yml) and `distribution-gate` (distribution-gate.yml).

Never make the App a bypass actor. It pushes only to `release/*` and `chore/backmerge-*`, which the
ruleset does not cover, and reaches `next` only by merging the back-merge PR through the API, which
is subject to the ruleset like any merge (so a future rule requiring approving reviews would stop that
automatic merge and leave the PR for a human); the `vX.Y.Z` tag is pushed with `publish.yml`'s own job token. Those App
pushes are the App's only because checkout's persisted `GITHUB_TOKEN` header is kept off them
(`persist-credentials: false` in `release-prep.yml`; `git -c http.https://github.com/.extraheader=`
on the `app-push` calls in `publish.yml`). That header outranks the token in the remote URL, so
without it the push goes out as `github-actions[bot]` and its branch starts no CI (bizapps-forms #226).

## Troubleshooting

| Symptom | Meaning |
|---|---|
| A step fails to mint the App token | Dispatch **Verify the release App token**; it names which half is broken. |
| Some packages look published and others not, right after a green run | Wait about three minutes: npm's registry read is eventually consistent. Trust the `Publish to npm` step's own output over the registry. |
| Some packages genuinely did not publish | Re-run `publish.yml` on `main` (step 3). |
| A push is refused with `GH013` (protected-branch rule violation) | Someone reintroduced a push to `main`/`next`. Run `pnpm run lint:release-pushes` to find it and route the change through a PR. |
| A push is refused with a 403 naming `github-actions[bot]` | The push used the ambient token instead of the App token; see the persist-credentials notes in `release-prep.yml` and `publish.yml` (bizapps-forms #226). |
| `publish.yml` is red at **Merge the back-merge pull request** | Everything shipped; only the back-merge is left. The error names the failing checks, the timeout, the conflict or GitHub's refusal, and the PR. If nothing was pushed to the branch (a flaky or timed-out check), re-run the failed checks, then re-run `publish.yml` on `main` and it merges. If anything was pushed to it (a conflict resolution or a fix), a human reviews it and merges the PR with a merge commit by hand. Either way the next release is blocked until it merges. |
| The back-merge branch exists at an unexpected SHA | The workflow will not force-push over it, since someone may have resolved conflicts there. Delete the branch or open the PR by hand. |
| `release:plan` says the seed is owed | Step 0. |
