# Dependency updates

How Gridmix handles dependency bumps and CVE triage while the staged renewal is
in flight. The goal is to advance the renewal at a deliberate pace without
either ignoring the security backlog or letting auto-bumps fight the plan.

## The stack

Three layers, each doing one thing:

- **[Renovate](../renovate.json)** — scans manifests, opens update PRs.
  Configured in **dashboard-approval mode**
  (`dependencyDashboardApproval: true`): nothing auto-opens, every update sits
  on a checklist until ticked. `lockFileMaintenance` is off and
  `rangeStrategy: "replace"` keeps declared ranges stable. The 7-day
  `minimumReleaseAge` blocks auto-PRs on freshly published versions; the
  `vulnerabilityAlerts` rule bypasses that cooldown for CVE PRs only.
- **Socket.dev** — comments on every PR that touches dependencies with a
  supply-chain risk score (install scripts, new network/filesystem
  capabilities, typosquats, maintainer changes). Acts as the merge gate — a
  high Socket score blocks the merge even if Renovate's diff looks clean.
- **GitHub Dependabot Alerts** — passive CVE feed against the GitHub Advisory
  Database, enabled in *Settings → Code security*. Renovate reads these to
  decide which PRs fast-track via `vulnerabilityAlerts`. No Dependabot version
  updates — Renovate replaces that.

## Dashboard workflow

The single source of truth is the
[Dependency Dashboard issue](https://github.com/gridmix/gridmix/issues/1). It's
edited in place by Renovate as the dep tree changes — no proliferation of
issues. Sections you'll see:

- **Pending Approval** — updates waiting for a tick. This is the worklist.
- **Open** — PRs currently out for review.
- **Detected dependencies** — full inventory by package, useful as a map.

To act on an item: tick its checkbox in the issue body. Renovate notices on its
next run and opens the PR. To suppress an item permanently, leave a note next
to it and untick (or use `@renovatebot ignore` on a PR after it opens).

## Three exits for each item

Before merging *or* deferring, pick one of three outcomes. Don't let items
linger undecided.

1. **Resolve now** — tick the checkbox, review the PR (read the Socket comment),
   merge. Use when the bump aligns with the current renewal stage or is a
   trivial patch with no behavioral risk.
2. **Override and defer** — add a floor to `overrides:` in
   [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) using the existing comment
   pattern (CVE id, parent chain, API-stability rationale). Don't tick the
   dashboard checkbox. The override neutralizes the alert without committing
   to a parent bump. Use when the vulnerable dep is transitive, mitigation is
   safe (patch-only or same-major), and the parent bump belongs to a later
   renewal stage.
3. **Defer cleanly** — leave a one-line reason next to the checkbox, or close
   an auto-opened PR with `@renovatebot ignore` and a comment. Use when the
   update conflicts with the renewal sequence and an override isn't
   appropriate (e.g. dev-only tooling).

## Triage axes

When deciding which exit applies, weigh the item along two axes — not severity
in isolation.

**Severity weighted by reachability.** A critical CVE in a build-only ESLint
plugin matters materially less than a medium CVE on the runtime path. Before
reacting to a severity badge, ask: does this code run in the published
`gridmix` package, in `playground`, in dev tooling, or only in CI? Most of the
current overrides exist precisely because the affected code paths are
puppeteer-only, datocms-only, or request-chain dev-time only.

**Direct vs. parent-mediated.** Many open CVEs are transitive (e.g. the
`request@2` chain, `chokidar@2` chain). Don't bump leaves when a parent bump
will dissolve them collectively. Renovate's PR body shows the parent chain —
prefer one parent upgrade that eliminates several overrides over the same
number of leaf bumps. This is what makes the one-dep-per-step renewal cadence
work.

## Vulnerability-alert PRs auto-open

PRs created from `vulnerabilityAlerts` bypass `dependencyDashboardApproval` and
appear automatically. When one shows up: it's either *resolve now* (merge it)
or *override and defer* (close the PR with a comment, add the floor in
`pnpm-workspace.yaml`). The "open vulnerability PR collecting dust" state is
the worst of both worlds — it means the alert is still active and nobody has
decided what to do with it.

## End-of-stage sweep

At the end of each renewal step, re-read `pnpm-workspace.yaml`'s `overrides:`
block. Each entry documents the parent chain that justified it. When a
renewal step bumps or removes one of those parents, the corresponding override
becomes dead weight masquerading as security hygiene — `pnpm` will resolve a
clean version regardless. Remove stale overrides as part of the step's cleanup
so the audit surface shrinks rather than accretes.

## Cadence

Pick a regular slot (weekly is enough) for dashboard triage rather than
reacting to PRs as they appear. Walk the *Pending Approval* list, pick one or
two items aligned with the current renewal stage, exit each via one of the
three routes above. Anything that doesn't fit the stage stays on the list with
a note. The dashboard is a living backlog, not an inbox.
