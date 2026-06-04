# Releasing Gridmix

This monorepo uses [Changesets](https://github.com/changesets/changesets) with **independent per-package versioning** to ship `@gridmix/*` packages (and the `gridmix` core) to npm. This document covers the day-to-day flow, the alpha/beta prerelease flow potentially useful during the long-running Gridsome-to-Gridmix migration and tooling "refreshment", and some historical notes from the previous Lerna setup.

The active flow is **local-only**: releases are cut by a maintainer from `main` on their machine. There is intentionally no release CI yet — see [Future improvements](#future-improvements) for the path to automation (after finishing stabilizing updates).

## Versioning model

- **Independent versioning.** Each package in `packages/*` and the `gridmix` core can ship on its own cadence. Empty `fixed` and `linked` arrays in `.changeset/config.json` give the same per-package independence Lerna's `"independent"` mode did.
- **Internal dependency bumps.** When a published package is updated, any other workspace package that depends on it via `workspace:*` receives an automatic patch bump (`updateInternalDependencies: "patch"` in `.changeset/config.json`). This keeps the dependency graph internally consistent without authors having to write a changeset for every transitive consumer.
- **Private workspaces are excluded.** `playground` is listed in `ignore`. Other private packages (anything with `"private": true` in its `package.json`) are auto-skipped by changesets, but listing `playground` keeps the intent explicit.
- **Public access by default.** `access: "public"` in `.changeset/config.json` is required for the `@gridmix/*` scope.

## Root scripts

| Script | What it does | Who runs it |
|---|---|---|
| `pnpm changeset` | Interactive prompt → writes `.changeset/<random-name>.md` declaring which packages changed and at what bump level. | Every contributor whose PR affects a published package. |
| `pnpm changeset:status` | Prints a verbose preview of pending changesets: which packages would bump, to what versions, and what each changelog entry will say. Non-destructive. | Maintainer, before releasing. |
| `pnpm changeset:version` | Consumes every `.changeset/*.md` file: bumps each affected `package.json`, regenerates each `CHANGELOG.md`, updates internal dependents, deletes the consumed changesets. | Maintainer, on `main`, when cutting a release. |
| `pnpm changeset:publish` | Runs `npm publish` for each package whose version is not already on the registry, honours `access: "public"`, and creates a git tag per published package. Requires an authenticated npm session. | Maintainer, immediately after `changeset:version`. |

> `pnpm changeset pre enter <tag>` and `pnpm changeset pre exit` (for prereleases) are also available — they're the changesets CLI directly, no script wrapper needed.

## Authoring a changeset

This is the only step every contributor needs to know.

After making a code change that should ship, run from the repo root:

```bash
pnpm changeset
```

You'll be prompted to:

1. **Pick the affected packages** — space to select, enter to confirm. `playground` and other private workspaces are hidden.
2. **Choose a bump level per package** — major / minor / patch. The CLI asks per tier, in order; press enter past the tiers you don't want.
3. **Write a short summary** — this becomes the bullet in `CHANGELOG.md`, so write it for end users, not for the reviewer.

The result is a markdown file like `.changeset/silly-otters-jump.md`:

```markdown
---
"@gridmix/cli": minor
---

Add `--template` flag to `gridmix create` for selecting a starter from a known list.
```

Commit this file alongside your code change. **PRs that affect a published package without a changeset should be flagged in review.** The exception is changes that are genuinely release-irrelevant (docs, internal tests, CI config, refactors with no behaviour change) — those can ship without one.

### Conventions for summaries

- Bump levels are **explicit**, set in the frontmatter. Conventional Commits (`feat:` / `fix:` / `BREAKING CHANGE`) no longer drive bumps the way they did under Lerna — but if the visual conventional changelog style will still be needed, it is always possible to prefix the summary text with `fix:` / `feat:`; it will appear literally in the changelog bullet.
- One PR can write **multiple changesets** if the changes are logically distinct and deserve separate bullets. Alternatively, one changeset can list multiple packages with different bump levels.
- For repo-only changes that touch a published package but shouldn't trigger a release, you can create an **empty changeset** with `pnpm changeset --empty`. It contributes no bullet and no bump, but documents the deliberate skip.

## Local release flow

The happy path, run from a clean `main` with everything pushed and pulled:

```bash
# 1. Preview what's about to happen
pnpm changeset:status

# 2. Consume changesets → bumps package.jsons, writes CHANGELOGs, deletes .changeset/*.md
pnpm changeset:version

# 3. Review the diff carefully — version bumps and changelog entries are the release contract
git diff

# 4. Commit
git add .
git commit -m "chore(release): version packages"

# 5. Publish to npm (must be logged in: `npm whoami` should return your user)
pnpm changeset:publish

# 6. Push commit + tags
git push
git push origin --tags
```

`changeset:publish` skips packages whose new version is already on the registry, so re-running it is safe if step 5 partially failed.

### Worked example

Suppose three changesets have accumulated since the last release:

- `cool-pandas-sing.md`: `@gridmix/cli: minor` — "Add `--template` flag"
- `quiet-foxes-run.md`: `@gridmix/cli: patch` — "Fix typo in help output"
- `bright-otters-swim.md`: `@gridmix/source-filesystem: patch` — "Fix file watcher race on macOS"

Running `pnpm changeset:version` produces:

- `@gridmix/cli`: highest bump wins → minor → `0.3.4` → `0.4.0`, with both bullets in its CHANGELOG.
- `@gridmix/source-filesystem`: patch → `0.6.2` → `0.6.3`.
- Any package depending on either of these via `workspace:*` gets a patch bump (per `updateInternalDependencies`).
- All three `.changeset/*.md` files are deleted.

After commit + publish, two git tags are pushed: `@gridmix/cli@0.4.0`, `@gridmix/source-filesystem@0.6.3` (plus any tags for transitively-bumped internal dependents).

## Prereleases — alpha and beta channels

Because Gridmix is a long-running migration/renewal of an inactive codebase, you'll want to ship under alpha/beta dist-tags before promoting to stable. Changesets handles this with the `pre` subcommands.

### Entering prerelease mode

```bash
pnpm changeset pre enter alpha
```

This writes `.changeset/pre.json` recording the mode, the tag (`alpha`), and the initial versions of all packages. From now until `pre exit`, every `changeset:version` run produces a prerelease version (`0.4.0-alpha.0`, `0.4.0-alpha.1`, …) and every `changeset:publish` pushes with `npm dist-tag = alpha`.

That last bit is the important one: **`npm install @gridmix/cli` continues to install the latest stable**; only `npm install @gridmix/cli@alpha` (or `@next`, or whatever tag) opts into the prerelease.

Commit `.changeset/pre.json` to the repo — its presence is what tells changesets you're in pre mode.

### Working in prerelease mode

Author changesets exactly as normal:

```bash
pnpm changeset                  # pick packages, bump level, summary
pnpm changeset:version          # bumps to e.g. 0.4.0-alpha.0
pnpm changeset:publish          # publishes with dist-tag = alpha
```

Each subsequent `changeset:version` increments the prerelease counter rather than the underlying version, so a stream of patches under alpha looks like `0.4.0-alpha.0`, `0.4.0-alpha.1`, `0.4.0-alpha.2`. The changesets accumulate inside `pre.json` rather than being deleted, so the eventual stable release can summarise everything that landed during the prerelease window.

### Switching from alpha to beta

```bash
pnpm changeset pre exit
pnpm changeset pre enter beta
```

Subsequent versions become `0.4.0-beta.0`, `0.4.0-beta.1`, etc., published with `dist-tag = beta`.

### Exiting to a stable release

```bash
pnpm changeset pre exit
pnpm changeset:version          # bumps from 0.4.0-beta.N → 0.4.0 (stable)
pnpm changeset:publish          # publishes with dist-tag = latest
git add . && git commit -m "chore(release): version packages"
git push --follow-tags
```

The stable CHANGELOG entry collapses all the prerelease changesets into a single `## 0.4.0` section, so consumers see one coherent release note rather than a wall of `-alpha.N` entries.

Pre mode can be re-entered again for the next major any time after going stable.

## Conventions and gotchas

- **`workspace:*` is the only acceptable internal dependency range.** Changesets resolves `workspace:*` to the published version at `changeset:version` time. Hard-coded ranges (`"@gridmix/cli": "^0.3.4"`) defeat the auto-bump.
- **Don't edit `package.json` versions or `CHANGELOG.md` files by hand.** They're generated. If you need to fix a wrong entry, edit the changeset's summary *before* running `changeset:version`, or amend the changelog in the release commit and re-publish.
- **`pnpm changeset:publish` requires npm login.** Run `npm login` once on the release machine; `npm whoami` should return your account before publishing.
- **Snapshot/canary builds** (`changeset version --snapshot`) exist but are a different mechanism from prereleases — they produce timestamped versions like `0.0.0-canary-20260524023045` for one-off testing builds, not channel releases. Not currently used.

## Migration notes from Lerna

The previous Gridsome setup used Lerna (`version: "independent"`, `conventionalCommits: true`) driven from a maintainer's machine on `master`. Gridmix replaces that with changesets. The behaviour differences worth knowing:

- **Bump level is explicit, not inferred.** Lerna read commit messages (`feat:` → minor, `fix:` → patch, `BREAKING CHANGE` → major). Changesets requires the author to declare the bump in a `.changeset/*.md` file. Conventional Commits remain useful for repo hygiene but are no longer load-bearing for releases.
- **Changelogs are written from changeset summaries, not commits.** Each file's body becomes the changelog entry. Write summaries for end users, not for reviewers. The default `@changesets/cli/changelog` renderer also groups entries by bump tier (Major / Minor / Patch) rather than by commit type (Features / Bug Fixes) — see [Future improvements](#future-improvements) for upgrading this.
- **No more `ignoreChanges` file globs.** Lerna used file-path patterns (`**/__tests__/**`, `**/__fixtures__/**`, non-README `*.md`) to decide whether a change warranted a version bump. With changesets you simply don't author a changeset for changes that shouldn't ship — the equivalent is reviewer discipline, not config.
- **Independent versioning is preserved**, via empty `fixed` and `linked` arrays.
- **`playground` is excluded from releases** via `ignore`. Other private packages are auto-skipped.
- **Publish access is `public`.** Lerna inherited this from each package's `publishConfig`; changesets sets it workspace-wide.
- **The `allowBranch: "master"` guard has no direct equivalent.** Discipline: only run `changeset:version` and `changeset:publish` from `main`. Branch protection rules and release CI (see below) are the durable enforcement mechanisms.
- **`scripts/changelog.js` is gone.** It was a one-off backfill tool to rebuild per-package CHANGELOGs from git tags. Changesets generates changelogs incrementally; there is no equivalent need.

## Future improvements

Listed roughly in order of expected payoff:

- **Automated release PRs via [`changesets/action`](https://github.com/changesets/action).** A GitHub workflow on `main` that, whenever pending `.changeset/*.md` files exist, opens (or updates) a "Version Packages" PR with the version bumps and changelog updates already applied. Merging the PR triggers a publish step in the same workflow. This is the closest equivalent to `lerna publish` in CI and is how most changesets-based monorepos run releases. Coexists cleanly with the local flow: when there are no pending changesets, the workflow is a no-op. A drop-in starting point:

  ```yaml
  # .github/workflows/release.yml
  name: Release

  on:
    push:
      branches: [main]

  concurrency: ${{ github.workflow }}-${{ github.ref }}

  jobs:
    release:
      runs-on: ubuntu-latest
      permissions:
        contents: write
        pull-requests: write
      steps:
        - uses: actions/checkout@v6
          with:
            fetch-depth: 0
        - uses: pnpm/action-setup@v6
        - uses: actions/setup-node@v6
          with:
            node-version: 22
            cache: pnpm
        - run: pnpm install --frozen-lockfile
        - uses: changesets/action@v1
          with:
            version: pnpm changeset:version
            publish: pnpm changeset:publish
            commit: "chore(release): version packages"
            title: "chore(release): version packages"
          env:
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
  ```

  Requires an `NPM_TOKEN` secret with publish rights to the `@gridmix` scope.

- **Richer changelogs via [`@changesets/changelog-github`](https://github.com/changesets/changesets/tree/main/packages/changelog-github).** Auto-links PRs and contributors in each changelog entry. Swap the `changelog` key in `.changeset/config.json` and provide a `repo` option plus a GitHub token in CI.
- **Branch protection on `main`.** Once release CI exists, protect `main` so direct pushes are disallowed; releases happen only via merged Version Packages PRs.
- **Linked groups.** If `@gridmix/cli` and the `gridmix` core ever need to version in lockstep, add them to `linked` in `.changeset/config.json` without losing independence elsewhere.
- **PR check: require a changeset.** The [`changesets/changeset-bot`](https://github.com/changesets/bot) (or a custom CI step using `changeset status --since=origin/main`) comments on PRs that touch publishable packages without a changeset.
