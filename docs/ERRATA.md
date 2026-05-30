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
