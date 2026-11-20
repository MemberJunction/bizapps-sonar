# Release lines

bizapps-sonar follows MJ's branch model, as agreed in the "OpenApp Release Lines" spec (Nov 10,
2026). `next` is built on MJ Edge and never publishes. Each MJ version gets a release line,
`lts/<MJ major.minor>`, which is what production hosts run.

| Branch | Built on | Publishes | What lands there |
|---|---|---|---|
| `next` | MJ Edge | never | all new work, first |
| `lts/X.Y` | MJ X.Y | yes | backports from `next` |
| `main` | the newest line | yes, as `latest` | release merges only |

## The line status record

[`release-lines.json`](../release-lines.json) lists each line: its branch, the MJ version it was
cut for (`mjVersion`, never raised), the app major it publishes, whether it is `open` or `lts`,
and whether it releases through `main` or from its own branch. It also lists `next`'s edge-only
migrations. CI always reads the copy on `next`. Freezing a line or marking a migration edge-only is
a support decision: have one of the owners in `.github/CODEOWNERS` review the change
(`protect-release-branches` does not enforce code-owner review on `next`).

A line is `open` (features, fixes and migrations, all backported from `next`) or `lts` (code
fixes only). An LTS line never reopens.

## Daily flow

1. Open the PR against `next`, with a changeset as today.
2. Add a `backport lts/X.Y` label for each line it should reach (e.g. `backport lts/6.1`). When the
   PR merges, the bot opens one cherry-pick PR per line. A conflict comes back as a draft PR for
   you to finish; if you add a commit of your own to resolve it, add the `backport-adjusted` label.
3. A PR that **adds a migration** must be labelled for **every open line**, or be edge-only (it
   needs the upcoming MJ version): list each of its files in `next.edgeOnlyMigrations`. Edge-only
   migrations stay on `next` until the next cut. Don't mix edge-only and shared migrations in one
   PR.
4. Shared migrations must run on the oldest open line's MJ version. Generate them (CodeGen) in a
   workspace checked out on that line, then land the result on `next`.

## Publishing

- `next` never publishes (`publish.yml` refuses any ref other than `main`).
- **Newest line (`lts/6.1`), through `main`:** releases go through `main` and publish as `latest`,
  tagging `vX.Y.Z` (see [`docs/release.md`](../docs/release.md) for the release pipeline details).
- **Older lines, from their own branch:** once a newer line takes over `main`, older lines move to
  `releasesThrough: "branch"` and publish under the npm dist-tag `lts-X.Y`.
- A changeset backported to multiple lines is released once on each line.

## The checks

| Check | On | What it enforces |
|---|---|---|
| `lines: record` | PRs into `next` | `release-lines.json` is valid; a line's branch, MJ version and major never change; LTS never reopens |
| `lines: backport or edge-only` | PRs into `next` | an added migration is labelled for every open line, or is edge-only; no migration goes to an LTS line |
| `lines: on next first` | PRs into `lts/*` | every commit carries `(cherry picked from commit <sha>)` with `<sha>` on `next`; hand-written conflict fixes need `backport-adjusted` |
| `lines: migrations` | PRs into `lts/*` | open line: its migrations are `next`'s, same content, no edge-only ones, none skipped (older than the line's newest); LTS line: no migration or metadata change, no minor or major changeset |
| `lines: mj pin` | PRs into `lts/*` and `main` | `@memberjunction/*` peers are the line range (`>=6.1.5 <6.2.0`), pins and the lockfile stay on the line's MJ minor, and `mj-app.json` has the line range and `"line"` |
| `repo: guards` | all PRs | cross-app ranges have an upper bound (private packages too); `mj.config.cjs` never sets `outOfOrder: true`; release-lines guard specs pass |

The `next`-only timestamp watermark in `changes.yml` does not run on a release line: a backported
migration is often older than the line's newest. `lines: migrations` checks order there instead.

## Cutting a line

The line cut is coordinated across apps: bizapps-common first, then the apps that depend on it.

1. On `next`, add the line to `release-lines.json` (`status: open`, `releasesThrough: main`) and
   move the previous newest line to `releasesThrough: branch`. Merge after a review by one of its
   owners.
2. Create `lts/X.Y` from `next` and verify the `protect-lts` ruleset covers `lts/*`.
3. On a branch off the new line, run
   `node .github/scripts/check-mj-line.mjs --line X.Y --file release-lines.json --fix`, then
   `pnpm install --lockfile-only`. This caps the MJ peers at the line, pins `mj-app.json`, and
   adds `"line"`. Set the line's `.github/CODEOWNERS` to `* <the line's reviewers>`; `protect-lts`
   requires code-owner review, so every change to the line needs one of them. From the 6.2 line on,
   also add a `major` changeset (each line has its own app major) and re-stamp edge-only migrations
   to the cut date on SQL Server and PostgreSQL together. Open it into `lts/X.Y` with the
   `line-cut` label (a maintainer or admin adds it).
4. The first release of a new newest line replaces `main`'s history with the line's. That step is
   not automated yet; it will be documented when the next line is cut.

## Not settled yet

- Whether a migration generated by a newer MJ's CodeGen runs on an older MJ database. Until it is
  verified, generate shared migrations on the oldest open line (daily flow step 4).
- How long an LTS line is supported, and who retires it.
- Multi-line publish workflow cutover (publishing older lines directly from `lts/X.Y` under
  `lts-X.Y` dist-tags) once a second release line is cut.
