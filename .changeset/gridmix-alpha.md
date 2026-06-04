---
"gridmix": minor
"@gridmix/cli": minor
"@gridmix/plugin-critical": minor
"@gridmix/plugin-google-analytics": minor
"@gridmix/remark-prismjs": minor
"@gridmix/source-filesystem": minor
"@gridmix/transformer-remark": minor
"@gridmix/vue-remark": minor
---

First (highly experimental at this stage) alpha release of Gridmix — the revival fork of Gridsome with [partially] modernized dependencies and properly (🤞) working core workflows. The scope of current changes is something about:

- **Workspace renamings:** all packages published under the new `@gridmix/*` scope (core as `gridmix`).
- **Toolchain migration:** pnpm 11, Node >=22.18, Changesets release flow, Renovate (initialized).
- **Dependencies updates:** Express 5, Sharp, Joi, chalk (ESM), fs-extra, lru-cache, chokidar, globby and more updated; `sockjs`, `express-graphql` and
  `graphql-playground-middleware-express` removed (the `/___explore` flow is shimmed).
- **Security starters:** some vulnerable transitive deps floor-pinned via pnpm overrides.
- **Tests:** migrated to Jest 30.
- **Migration fixes:** SSR, build context, and lint fixes surfaced during consumer testing.
