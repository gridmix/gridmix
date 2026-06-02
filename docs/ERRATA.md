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
