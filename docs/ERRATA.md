# Errata

Issues and workarounds discovered during real-project testing of Gridmix. Each entry describes the symptom, root cause, and the fix applied.

---

## `sass.dart.js` Critical dependency warning blocks dev-server pages

**Discovered in:** `https://github.com/fyodorio/fyodorio-is-gridsome`  
**Affects:** development mode, all pages

### Symptom

After starting the dev server, all pages show the webpack error overlay instead of rendering:

```
Compiled with problems:
×
WARNING in ../../node_modules/.pnpm/sass@1.100.0/node_modules/sass/sass.dart.js 29:17-24
Critical dependency: require function is used in a way in which dependencies cannot be statically extracted
```

### Root cause

`gridmix.config.js` passes `implementation: require('sass')` as a loader option to `sass-loader`. Webpack 5's filesystem cache serializer follows that module reference into `sass.node.js` → `sass.dart.js`, which contains dynamic `require()` calls it cannot statically analyze. This produces the "Critical dependency" warning. Because the dev server is configured with `client.overlay: true`, the overlay is injected into every page, covering the content.

### Fix

Add a `chainWebpack` entry to the project's `gridmix.config.js` to suppress this specific warning. The warning is harmless — sass compiles correctly — so suppressing it is safe:

```js
chainWebpack (config) {
  config.merge({
    ignoreWarnings: [
      {
        module: /node_modules[/\\]sass[/\\]sass\.dart\.js/,
        message: /Critical dependency/
      }
    ]
  })
},
```

The fix is intentionally kept in the project config (not in gridmix's `createBaseConfig.js`) because the cause is project-specific: the `implementation: require('sass')` option that triggers webpack's module-graph traversal into the sass package.

---

## `vue-remark` cannot find user remark plugins under linked/pnpm installs

**Discovered in:** the `gridmix-website` (gridsome.org docs) migration  
**Affects:** plugin initialization, any project using `@gridmix/vue-remark` with a user-provided remark plugin (e.g. `@gridmix/remark-prismjs`)

### Symptom

`gridmix develop` (or `build`) crashes during "Initializing plugins..." with:

```
Error: Cannot find module '@gridmix/remark-prismjs'
Require stack:
- .../packages/transformer-remark/lib/utils.js
- .../packages/transformer-remark/index.js
- .../gridmix/lib/app/loadConfig.js
  ...
```

even though `@gridmix/remark-prismjs` is correctly installed and resolvable from the consuming project root.

### Root cause

`@gridmix/transformer-remark` resolves user-provided remark plugins from the **consuming project's** root via `require.resolve(entry, { paths: [context] })` (`packages/transformer-remark/lib/utils.js`, `resolvePlugin`). That `context` is the project root, passed in as `context.context` to the transformer's constructor.

The core `PluginStore._createTransformer` passes it correctly (`context: this._app.context`), so the `@gridmix/source-filesystem` → `transformers.remark` path works. But `@gridmix/vue-remark` resolves user plugins in **two** places of its own, and both bare-`require`d the plugin from vue-remark's location inside the Gridmix repo — where the user plugin is not reachable. Under hoisted (Gridsome-era yarn/npm) installs this accidentally worked because every package shared one flat `node_modules`; under pnpm/linked installs it does not.

1. `packages/vue-remark/index.js` constructs its own `RemarkTransformer` instance and **omitted the `context` property**, so `transformer-remark`'s `resolvePlugin` fell back to a bare `require(entry)`.
2. `packages/vue-remark/lib/utils.js` → `createCacheIdentifier` scans the project's `package.json` for `remark-*` deps and then `require(name)` / `require(`${name}/package.json`)` to build a cache key — again resolving from vue-remark's own location rather than the project that declared the dependency.

### Fix

Applied in Gridmix source — resolve from the consuming project in both spots:

```js
// packages/vue-remark/index.js — pass project root into the transformer
this.remark = new RemarkTransformer({}, {
  assets: api._app.assets,
  context: api.context, // resolve user remark plugins from the consuming project
  localOptions: { ... }
})
```

```js
// packages/vue-remark/lib/utils.js — resolve cache-identifier plugins from context
.map(name => ({
  fn: require(require.resolve(name, { paths: [context] })),
  pkg: require(require.resolve(`${name}/package.json`, { paths: [context] }))
}))
```

No project-side workaround is required once Gridmix carries these fixes. General lesson: **every** code path that resolves a user-declared package (transformer instantiation *and* cache-key/metadata scans) must resolve from the consuming project's `context`, since Gridsome-era plugins assumed a hoisted `node_modules` that pnpm/linked installs deliberately do not provide.

---

## Transient `ENOENT` overlay errors for generated `app/*.js` during `develop`

**Discovered in:** the `gridmix-website` (gridsome.org docs) migration  
**Affects:** development mode, intermittently, after navigating between routes

### Symptom

While `gridmix develop` is running, navigating around the site sporadically fills the webpack overlay with build failures for the generated app bundle, e.g.:

```
Compiled with problems:
×
ERROR in ./node_modules/.cache/gridmix/app/config.js
Module build failed (from .../babel-loader/lib/index.js):
Error: ENOENT: no such file or directory, open '.../node_modules/.cache/gridmix/app/config.js'
ERROR in ./node_modules/.cache/gridmix/app/routes.js
Error: ENOENT: no such file or directory, open '.../node_modules/.cache/gridmix/app/routes.js'
  ...same for constants.js, icons.js, plugins-client.js, plugins-server.js
```

The named files almost always exist on disk by the time you go looking — the errors are stale, and a hard browser reload (or the next clean recompile) clears the overlay.

### Root cause

The generated app bundle (`config.js`, `constants.js`, `icons.js`, `routes.js`, `plugins-client.js`, `plugins-server.js`) is code-generated at boot and regenerated whenever the graph changes (route added/visited, config touched, plugin/HMR reload). Gridmix writes these by unlink + rewrite rather than an atomic swap, so there is a brief window where the file is absent. webpack's watcher can fire a rebuild inside that window, and babel-loader's `open()` hits `ENOENT`. Because the dev server runs with `client.overlay: true`, the last failed compilation is shown on every page until a successful recompile replaces it — so the failure looks like it is "coming from cache."

The window is widened by **where** the bundle lives. `loadConfig.js` (`config.cacheDir` / `config.appCacheDir`) defaults the generated app to **`node_modules/.cache/gridmix/app`**:

```js
// gridmix/lib/app/loadConfig.js
} else {
  config.cacheDir = resolve('node_modules/.cache/gridmix')
}
config.appCacheDir = path.join(config.cacheDir, 'app')
```

`node_modules/.cache` is the conventional **disposable** cache location — babel-loader's own `cacheDirectory` defaults next door to `node_modules/.cache/babel-loader`, and assorted clean steps / package managers assume anything under `node_modules/.cache` is throwaway. Putting load-bearing webpack entry modules there means any unrelated cache invalidation or clean can momentarily remove them, enlarging the ENOENT race. (Upstream Gridsome keeps this under `src/.temp` for exactly this reason.)

### Fix

Mostly benign — the transient overlay self-clears on the next clean recompile; a hard reload dismisses a stale one. If files go genuinely missing, stop the server, `rm -rf node_modules/.cache/gridmix`, and re-run `gridmix develop` to force a full regen.

To stop it recurring, move the generated app out of `node_modules/.cache`. There is already an escape hatch: `loadConfig.js` honors `localConfig._tmpDir` (resolved against the project root) before falling back to the `node_modules/.cache` default, so a project can set it to a project-local dir (e.g. `src/.temp`). The proper fix is upstream — default `cacheDir` to a non-`node_modules/.cache` location so the generated bundle no longer shares a directory the toolchain treats as disposable. General lesson: **generated webpack entry modules must not live under `node_modules/.cache`** — that path is owned by cache-cleaning tooling, not by the build graph.

---

## Fenced code blocks render empty (`remark-prismjs` output stripped by `remark-html@13`)

**Discovered in:** the `gridmix-website` (gridsome.org docs) migration  
**Affects:** any markdown rendered via `@gridmix/transformer-remark` using `@gridmix/remark-prismjs` — code blocks silently disappear from `node.content`. Worst for code-only documents, which render completely empty.

### Symptom

A collection of pure code-block markdown (the site's `examples/*.md`, queried by `Examples.vue`) returns empty `content`:

```graphql
{ allExample { edges { node { title content timeToRead } } } }
# -> every node: content "", timeToRead 0   (title/frontmatter are fine)
```

Blog posts (prose + code) appear to work but silently lose their code samples — only the prose survives.

### Root cause

`@gridmix/remark-prismjs` highlights code and emits the result as a raw `html` mdast node (`u('html', toHTML(preNode))`). `@gridmix/transformer-remark` stringifies with `remark-html@13`, which **sanitizes (drops) raw HTML by default**. So every highlighted code block is stripped during HTML generation. Plain code (no prismjs) survives because `remark-html` renders the native `code` node itself.

The dependency set is a mismatch from modernization — `remark-parse@6` + `unified@7` (old) alongside `remark-html@13` (new, sanitizes by default). The transformer called `.use(options.stringifier || remarkHtml)` with **no options**.

Reproduction (in `packages/transformer-remark`):
```js
unified().use(remarkParse).use(require('@gridmix/remark-prismjs')).use(remarkHtml)            // ``` block -> ""  (dropped)
unified().use(remarkParse).use(require('@gridmix/remark-prismjs')).use(remarkHtml,{sanitize:false}) // -> <pre class="language-js">…
```

### Fix

Applied in Gridmix source (`packages/transformer-remark/index.js`, `createProcessor`). Content here is author-trusted, so disable sanitization for the default HTML stringifier (custom stringifiers such as vue-remark's `toSFC` are left untouched):

```js
if (options.stringifier) {
  processor.use(options.stringifier)
} else {
  processor.use(remarkHtml, { sanitize: false })
}
```

This restores code blocks in `content`, `excerpt`, and `timeToRead` for every remark collection. General lesson: when a remark plugin emits raw HTML (prismjs, embeds), the `remark-html` stringifier must run with `sanitize: false` or the output is silently discarded.

---

## SSR can't resolve externalized node modules under linked/pnpm installs (`basedir`)

**Discovered in:** the `gridmix-website` (gridsome.org docs) migration  
**Affects:** `gridmix build` (HTML generation phase), any project that externalizes its `node_modules` in the SSR webpack config (the default `webpack-node-externals` setup) while Gridmix is linked or otherwise outside the project's `node_modules`.

### Symptom

Bootstrap, asset compilation, and GraphQL all succeed, then HTML generation fails:

```
Could not generate HTML for "/blog/.../say-hello-to-gridsome/":
Error: Cannot find module 'vue-lazy-hydration' from '/…/gridmix/gridmix/lib/server'
    at Function.resolveSync [as sync] (…/resolve/lib/sync.js)
    at …/vue-server-renderer/build.prod.js  (external commonjs "vue-lazy-hydration")
```

`vue-lazy-hydration` is a direct dependency of the consuming project and is installed — but resolution is attempted from **Gridmix's** `lib/server`, not the project.

### Root cause

The SSR webpack config externalizes `node_modules` (via `webpack-node-externals`), so packages like `vue-lazy-hydration` are emitted as `require()` calls in the server bundle instead of being bundled. At render time, `vue-server-renderer`'s `createBundleRenderer` resolves those externals relative to its `basedir`. Gridmix hard-coded:

```js
// gridmix/lib/server/createRenderFn.js
const renderer = createBundleRenderer(serverBundle, { /* … */ basedir: __dirname })
```

`__dirname` is Gridmix's own `lib/server`. Under a normal install Gridmix sits inside the project's `node_modules`, so walking up from `__dirname` reaches the project's dependencies and it works by accident. Under a linked/pnpm install Gridmix lives in a separate tree, so the project's externalized deps are unreachable and SSR throws. (Original Gridsome has the same `basedir: __dirname`.)

### Fix

Thread the consuming project's context to the renderer and use it as `basedir`, so externals resolve from the project's `node_modules`:

```js
// gridmix/lib/build.js -> worker.render({ …, context: app.context })
// gridmix/lib/workers/html-writer.js -> createRenderFn({ …, context })
// gridmix/lib/server/createRenderFn.js
basedir: context || __dirname
```

General lesson (recurring): Gridsome-era code resolves modules relative to its own `__dirname`, which only reaches project dependencies when Gridmix is hoisted into the project's `node_modules`. Linked/pnpm installs require resolving from the **consuming project's context** instead — same root cause as the `vue-remark`/`transformer-remark` plugin-resolution fixes.
