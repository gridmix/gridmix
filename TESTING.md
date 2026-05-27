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
