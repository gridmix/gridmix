# Testing

How changes in Gridmix are verified. Most behavior is covered by the automated
suites below. A few paths are awkward to unit-test (closures, code that needs a
production build, etc.) and are verified by hand until they can be wrapped in an
e2e test — those live in [Manual verification recipes](#manual-verification-recipes).

## Automated suites

- `pnpm test:unit` — Jest unit/integration tests, run in band.
- `pnpm test:e2e` — Jest end-to-end build tests (`*.e2e.js`).

## Manual verification recipes

Recipes for behavior not yet covered by an automated test. Each is a candidate
to be promoted into `pnpm test:e2e`. **When you automate one, replace its entry
here with a link to the test** so this list only ever holds what is still manual.

Template for new entries: _Why manual_ · _What it guards_ · _Steps_ · _Expected_
· _Future automation_.

### Renderer SSR cache — `maxCacheAge` → `ttl` (lru-cache 5 → 10)

**Why manual:** the cache is a closure inside the `serve` middleware
(`gridmix/lib/server/middlewares/renderer.js`), which needs a production build to
run, so TTL expiry can't be asserted in a unit test without refactoring the
middleware.

**What it guards:** that `maxCacheAge` (default 1000 ms, overridable in
`gridmix.config.js`, read at `gridmix/lib/app/loadConfig.js`) maps to lru-cache's
`ttl`, so rendered pages are served from cache within the window and re-rendered
after it expires.

**Steps:**

1. In a Gridmix site, optionally set `maxCacheAge: 5000` in `gridmix.config.js`
   (a wider window is easier to observe than the 1000 ms default).
2. `gridmix build && gridmix serve` (this middleware runs under `serve`, not
   `develop`).
3. Request any page twice within the window. The second request logs
   `return cached <url>` in the serve console — a cache hit.
4. Wait longer than `maxCacheAge`, then request the same page again. No
   `return cached` log appears — the entry expired via `ttl` and the page was
   re-rendered.

**Expected:** cache hit on step 3, miss (re-render, no log) on step 4.

**Future automation:** promote to `pnpm test:e2e` — build a fixture site, start
the serve middleware, and assert the `return cached` log (or response timing)
across the TTL boundary.

### Dev hot-reload file watching (chokidar 3 → 4)

**Why manual:** the live file watchers run only under `gridmix develop`
(`NODE_ENV === 'development'`). Two of them — `chokidar.watch()` in
`gridmix/lib/plugins/vue-pages/index.js` and
`gridmix/lib/plugins/TemplatesPlugin.js` — are never reached by the unit suite,
and the route-change handler wired in `gridmix/lib/pages/watch.js` is skipped
whenever `GRIDMIX_TEST` is set (`gridmix/lib/pages/pages.js` `createWatcher()`).
`pages.spec.js` covers the low-level `FSWatcher` (add/unwatch/`getWatched`) but
not the end-to-end dev-server reload.

**What it guards:** that chokidar 4 still delivers add/unlink/change events for
files watched **by literal path** (chokidar 4 removed glob support and the
`disableGlobbing` option — all three watch sites here pass real paths/dirs, not
patterns, so behavior should be unchanged). Specifically that, with a dev server
running, the page/route graph updates live without a restart.

**Steps:**

1. In a Gridmix site, run `gridmix develop`.
2. **Pages watcher:** add a new file `src/pages/Watch-test.vue` (with minimal
   `<template><div/></template>`). Then delete it.
3. **Templates watcher:** with a content type that has a template component, add
   a matching template file under the configured templates path, then delete it.
4. **Change handler:** edit and save an existing component already rendered by a
   route (e.g. change static text in a `.vue` page).

**Expected:** step 2 makes `/watch-test` resolve (200) moments after the file is
added and 404 after it's deleted, with no server restart; step 3 makes the
template's route appear/disappear the same way; step 4 hot-reloads the page with
the edited content. No `Cannot use import statement` / module-load errors in the
dev console (the chokidar 4 CJS build loads cleanly under Node's require).

**Future automation:** promote to `pnpm test:e2e` — start `develop` against a
fixture site, mutate files on disk, and poll the dev server for the route
appearing/disappearing and the changed content being served.
