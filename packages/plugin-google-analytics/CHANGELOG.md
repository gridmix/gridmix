# Change Log

## 0.2.0-alpha.0

### Minor Changes

- First (highly experimental at this stage) alpha release of Gridmix — the revival fork of Gridsome with [partially] modernized dependencies and properly (🤞) working core workflows. The scope of current changes is something about:

  - **Workspace renamings:** all packages published under the new `@gridmix/*` scope (core as `gridmix`).
  - **Toolchain migration:** pnpm 11, Node >=22.18, Changesets release flow, Renovate (initialized).
  - **Dependencies updates:** Express 5, Sharp, Joi, chalk (ESM), fs-extra, lru-cache, chokidar, globby and more updated; `sockjs`, `express-graphql` and
    `graphql-playground-middleware-express` removed (the `/___explore` flow is shimmed).
  - **Security starters:** some vulnerable transitive deps floor-pinned via pnpm overrides.
  - **Tests:** migrated to Jest 30.
  - **Migration fixes:** SSR, build context, and lint fixes surfaced during consumer testing.

## [0.1.2](https://github.com/gridsome/gridsome/tree/master/packages/plugin-google-analytics/compare/@gridsome/plugin-google-analytics@0.1.1...@gridsome/plugin-google-analytics@0.1.2) (2020-09-18)

**Note:** Version bump only for package @gridsome/plugin-google-analytics

## [0.1.1](https://github.com/gridsome/gridsome/tree/master/packages/plugin-google-analytics/compare/@gridsome/plugin-google-analytics@0.1.0...@gridsome/plugin-google-analytics@0.1.1) (2020-05-26)

**Note:** Version bump only for package @gridsome/plugin-google-analytics

<a name="0.1.0"></a>

# 0.1.0 (2019-01-10)

### Features

- **google-analytics:** initial plugin ([#96](https://github.com/gridsome/gridsome/tree/master/packages/plugin-google-analytics/issues/96)) ([7128b60](https://github.com/gridsome/gridsome/tree/master/packages/plugin-google-analytics/commit/7128b60)), closes [#79](https://github.com/gridsome/gridsome/tree/master/packages/plugin-google-analytics/issues/79)
