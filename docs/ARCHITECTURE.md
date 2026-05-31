# Gridmix architecture
Gridmix is a Vue 2 static site generator and development server built around a Node.js bootstrap pipeline, a plugin API, a LokiJS-backed content store, generated GraphQL schema, generated Vue Router routes, and webpack 5 client/server bundles. This document describes how the codebase works today.
## Repository layout
The repository is a pnpm workspace. The workspace packages are declared in `pnpm-workspace.yaml` and the root `package.json`.
- Framework and CLI packages:
  - `gridmix/` is the framework package published as `gridmix`. It contains the runtime app, CLI command registrations for existing projects, server-side build/develop logic, data store, GraphQL schema builder, page/router model, webpack configuration, generated-code pipeline, asset queues, and workers.
  - `packages/cli/` is `@gridmix/cli`. It owns the global `gridmix` executable, project creation, global/local config inspection, environment info, command dispatch, update notifications, and version reporting.
- Optional package families:
  - `packages/source-*` packages are server-side source plugins that load external or local data into Gridmix collections.
  - `packages/transformer-*` packages parse source content by MIME type and can extend generated GraphQL node types.
  - `packages/plugin-*` packages are optional runtime/build plugins.
  - `packages/vue-remark/` combines filesystem sourcing, Markdown transformation, Vue single-file-component generation, page creation, and a client plugin for Markdown-driven Vue pages.
  - `packages/remark-prismjs/` is a Remark plugin package used by Markdown pipelines.
- Local development and docs:
  - `playground/` is a private workspace project for manual/local development.
  - `projects/` is included in the workspace for local test projects.
  - `docs/` contains maintainer documentation for testing, releasing, dependency update workflow, errata, and this architecture document.
## Package and command entry points
The executable path in `gridmix/package.json` points to `gridmix/bin/gridmix.js`, which simply requires `@gridmix/cli`. The `@gridmix/cli` executable lives at `packages/cli/bin/gridmix.js`.
The CLI does three things during startup:
- Creates a Commander program:
  - Global `create`, `config`, and `info` commands come from `packages/cli/lib/commands/`.
- Determines command context:
  - It finds the nearest `package.json`.
  - It treats that package directory as the command context.
- Loads project commands:
  - It attempts to resolve `gridmix/commands` or `gridmix` from the current project.
  - In a Gridmix project, resolving `gridmix` loads `gridmix/index.js`, which registers project commands.
The framework package registers these project commands:
- `gridmix develop`
  - Calls `gridmix/lib/develop.js`.
- `gridmix build`
  - Calls `gridmix/lib/build.js`.
- `gridmix explore`
  - Deprecated alias that delegates to `develop` through `gridmix/lib/explore.js`.
Command errors are wrapped by the framework command module. If an error stack points into the project context, Gridmix prints a Babel code frame for the project file; otherwise it prints the stack or error object.
## Core application object
The central server-side object is `App` in `gridmix/lib/app/App.js`. `gridmix/lib/app/index.js` creates an `App`, calls `app.bootstrap(phase)`, and returns the bootstrapped instance.
An `App` instance owns:
- Project state:
  - `context`: the project root.
  - `options`: command options and mode passed by `develop` or `build`.
  - `config`: normalized project/framework configuration from `loadConfig`.
- Framework subsystems:
  - `plugins`: the plugin manager.
  - `store`: content and metadata storage.
  - `schema`: GraphQL schema facade.
  - `assets`: file and image processing queues.
  - `pages`: page and route registry.
  - `codegen`: temporary generated app files.
  - `compiler`: webpack config and compiler facade.
- Development-server state:
  - `clients`: development WebSocket clients connected to `/___echo`.
The constructor also installs `process.GRIDMIX = this`, creates Tapable hooks, and autobinds instance methods.
The main app hooks are:
- Bootstrap hooks:
  - `beforeBootstrap`: async series hook used by `api.onInit`.
  - `bootstrap`: async series hook that runs the staged bootstrap work.
- Build/render hooks:
  - `renderQueue`: sync waterfall hook used to adjust the static render queue.
  - `redirects`: sync waterfall hook used to collect/adjust redirects during build.
Bootstrap phases are defined in `gridmix/lib/utils/constants.js`. The plugin manager registers three staged bootstrap hooks:
- `loadSource`: loads source data into the store.
- `createSchema`: builds the GraphQL schema.
- `createPages`: creates pages and templates.
Code generation is registered as a full-bootstrap hook and writes temporary modules after sources, schema, and pages exist.
## Configuration loading
`gridmix/lib/app/loadConfig.js` builds a frozen config object from defaults, environment files, local project files, command options, and normalized plugin/template/image settings.
Environment loading reads, in order:
- `.env`
- `.env.local`
- `.env.{NODE_ENV}`
- `.env.{NODE_ENV}.local`
Parsed values are merged into `process.env`, but existing environment variables take precedence.
Project config and server entries are resolved from:
- `gridmix.config.js` or `gridmix.config.ts`
- `gridmix.server.js` or `gridmix.server.ts`
TypeScript support for these files is implemented by registering a `require.extensions['.ts']` loader that uses esbuild to transform TypeScript to CommonJS.
The normalized config includes:
- Paths:
  - Project paths such as `context`, `staticDir`, `outputDir`, `assetsDir`, `imagesDir`, `filesDir`, `dataDir`, `pagesDir`, `templatesDir`, and cache directories.
  - Runtime paths such as `appPath`, `appCacheDir`, `clientManifestPath`, and `serverBundlePath`.
- Site metadata:
  - `siteName`, `siteDescription`, `siteUrl`, `titleTemplate`, and `metadata`.
- Build/runtime flags:
  - `mode`, `host`, `port`, `https`, `cache`, `runtimeCompiler`, `cacheBusting`, `catchLinks`, `prefetch`, and `preload`.
- Feature configuration:
  - CSS options, image options, icon options, permalinks, templates, redirects, transformers, and plugins.
Built-in plugins are prepended unless `options.useBuiltIn === false`. The built-ins are:
- `gridmix/lib/plugins/core`
- `gridmix/lib/plugins/vue-components`
- `gridmix/lib/plugins/vue-pages`
- `gridmix/lib/plugins/RedirectsPlugin.js`
- `gridmix/lib/plugins/TemplatesPlugin.js`
If a project has `gridmix.server.js`, that module is appended as a plugin entry.
Plugin entries are normalized by `normalizePlugins`. A plugin can be a function, absolute path, relative path, package name, file, or directory. Directory plugins can expose:
- `gridmix.server.js` or `index.js` as the server entry.
- `gridmix.client.js` as the client entry.
Transformers are discovered from the consuming project package dependencies/devDependencies. Package names matching Gridmix transformer naming conventions are required from the project context. Each transformer class advertises MIME types with `static mimeTypes()`, and Gridmix maps each MIME type to a transformer instance configuration.
## Plugin system
Server-side plugin loading is handled by `gridmix/lib/app/Plugins.js`.
During `plugins.initialize()`:
- Entry resolution:
  - Each normalized plugin entry resolves its server entry.
  - The server entry must export a function or class.
- Option/API setup:
  - `Plugin.defaultOptions()` is merged into entry options when present.
  - A `PluginAPI` instance is created.
- Invocation:
  - The plugin is invoked as either `new Plugin(api, options, { context })` or `Plugin(api, options, { context })`.
`PluginAPI` in `gridmix/lib/app/PluginAPI.js` exposes the public server-side plugin surface:
- Project/config access:
  - `context`, `config`, and `resolve()`.
- Client plugin bridging:
  - `setClientOptions()`.
- Build customization:
  - `transpileDependencies()`, `chainWebpack()`, `configureWebpack()`, and `configureServer()`.
- Component parsing:
  - `registerComponentParser()`.
- Bootstrap events:
  - `loadSource()`, `createSchema()`, `createPages()`, `createManagedPages()`.
- Lifecycle hooks:
  - `onInit()`, `onBootstrap()`, `onCreateNode()`.
- Build hooks:
  - `beforeBuild()` and `afterBuild()`.
Plugin event handlers are stored in the plugin manager by event name. Most events run asynchronously in registration order through `plugins.run()`. `configureServer()` runs synchronously against the Express app used by webpack-dev-server. `createManagedPages()` handlers are marked as `once`, so they are skipped on subsequent create-page cycles after running once.
The action objects passed into plugin hooks are created in `gridmix/lib/app/actions.js`:
- Source/schema actions expose store operations, metadata operations, GraphQL helper types, schema type helpers, schema resolver registration, schema extensions, and `graphql()`.
- Page actions expose `createPage()`, `createRoute()`, collection lookup, slugification, GraphQL execution, and page management methods for managed pages.
Client plugin entries are not executed by the Node plugin manager. Instead, code generation writes `plugins-client.js` and `plugins-server.js` into the app cache. Despite the filenames, both generated files contain browser/SSR runtime plugin entries built from `gridmix.client.js` files: `plugins-server.js` contains entries whose normalized plugin `server` flag is `true` and is imported by the shared app module, while `plugins-client.js` contains entries whose `server` flag is `false` and is imported only by the browser entry. Runtime entry files execute each generated entry with `(Vue, options, context)`.
## Built-in plugins
The core plugin writes site metadata into the store during `loadSource`, creates the `/404` page, marks 404 pages in page context, and adjusts the render queue so the 404 page is emitted as `/404.html` and `/assets/data/404.json`.
The Vue components plugin wires Vue single-file component custom blocks into webpack:
- `<page-query>` blocks are parsed from `.vue` files for route/page query generation.
- `<static-query>` and `<page-query>` custom blocks are loaded through dedicated loaders.
- External page query files referenced with `src` are resolved through the compiler resolver and added to page watch dependencies.
The Vue pages plugin scans `src/pages/**/*.vue`, converts file paths into route paths, creates managed pages, and watches the pages directory in development for added and removed `.vue` files.
The templates plugin turns collection nodes into pages. It reads template definitions from `gridmix.config.js` and collection options, computes node public paths, adds `path(to:)` schema resolvers, creates managed pages for matching template components, and subscribes to collection add/update/remove events to keep pages in sync.
The redirects plugin participates in route/render behavior for configured redirects.
## Store and content model
`gridmix/lib/store/Store.js` is the top-level data store. It owns:
- `collections`: a map of type name to `Collection`.
- `metadata`: a Loki collection keyed by metadata key.
- `nodeIndex`: a separate index used for cross-type lookup and belongs-to relationships.
- Store hooks for `addCollection` and `addNode`.
Each content collection is a `gridmix/lib/store/Collection.js` instance backed by a Loki collection. Collections track:
- The GraphQL type name.
- Collection options such as references, fields, date field, sorting defaults, unique/index fields, camel-casing, and asset path resolution behavior.
- MIME-type transformers attached to the collection.
- Event listeners for add/update/remove.
Adding or updating a node runs normalization and store hooks before the node is inserted into Loki. The default add-node hooks transform node content and process node fields. Store-level collection events update the global node index and update the store timestamp. In development, a changed timestamp can trigger app broadcasts after bootstrap.
`PluginStore` is the store facade used by plugins and source packages. It creates transformer instances for the plugin, resolves node file paths, creates references, adds metadata, adds collections, and exposes deprecated aliases used by older Gridsome plugins.
## Transformers and content parsing
Transformers are selected by MIME type. Source plugins usually create nodes with:
- `internal.mimeType`
- `internal.content`
- `internal.origin`
The store hooks use the matching transformer to parse raw content and merge parsed fields into the node. Transformers can also expose `extendNodeType()` to add GraphQL fields for nodes of collections that include their MIME type.
Examples:
- `@gridmix/transformer-json` parses JSON into object fields or wraps non-object JSON as `{ data }`.
- `@gridmix/transformer-yaml` does the same for YAML.
- `@gridmix/transformer-csv` parses CSV content.
- `@gridmix/transformer-remark` parses Markdown with gray-matter and Remark, adds fields such as `content`, `headings`, `timeToRead`, and `excerpt`, and can enqueue referenced files/images through Remark plugins.
## Source plugins
Source packages are normal server-side plugins. They typically call `api.loadSource()` and use the provided actions to create collections and add nodes.
`@gridmix/source-filesystem` is the local-file source. It:
- Creates a collection with a configured `typeName`.
- Glob-matches files from a configured base directory.
- Reads file contents and MIME type.
- Creates a node with file info, generated path, and `internal` content metadata.
- Optionally creates referenced nodes.
- Watches matching files in development and adds, updates, or removes collection nodes on filesystem changes.
Remote source packages follow the same store model but fetch data from external APIs. `@gridmix/source-graphql` is different from node-based source plugins: it introspects a remote GraphQL endpoint and adds a wrapped remote schema during `api.createSchema()`, exposing it under a configured field name.
## GraphQL schema
`gridmix/lib/app/Schema.js` wraps schema construction and query execution. It stores pending custom schemas, SDL/types, resolvers, and field extensions until `buildSchema()` is called.
Schema construction is implemented in `gridmix/lib/graphql/createSchema.js` using `graphql-compose`. The generated schema includes:
- Must-have internal types and directives.
- Built-in directives such as pagination, proxy, and reference directives.
- Custom SDL/types from plugins.
- Collection-derived node types.
- Metadata query type.
- Page query fields.
- External schemas added by plugins.
- Custom resolvers added by plugins.
- Processed references and belongs-to relationships.
For each collection, `gridmix/lib/graphql/nodes/index.js` creates:
- A GraphQL object type implementing `Node`.
- Connection and edge types.
- `Query.{typeName}` and `Query.all{TypeName}` fields.
- Filter input types.
- Find-one, paginated find-many, reference-one, reference-many, and advanced reference resolvers.
- Inferred fields from collection node data unless a custom type disables inference.
- Extra fields from transformers and collection schema fields.
The schema context exposes:
- `store`: collection and node lookup helpers.
- `pages`: page lookup helpers.
- `config`: the normalized config.
- `assets`: asset queues.
Queries can run through `app.graphql()` or `app.schema.runQuery()`. During development, `/___graphql` uses `graphql-http` with the current schema and context.
## Pages, routes, and queries
`gridmix/lib/pages/pages.js` owns the route and page model. It stores routes and pages in Loki collections.
A route contains:
- `id`, `type`, `name`, `path`, and `component`.
- Internal metadata such as parsed query, route regexp, dynamic keys, dependencies, priority, digest, and page/template metadata.
A page contains:
- `id`, `path`, `publicPath`, and `context`.
- Internal data such as route id, digest, query variables, managed flag, dynamic flag, and parsed page query variables/filters/pagination.
Pages can be created directly with `createPage()`, indirectly through routes with `createRoute().addPage()`, from files in `src/pages`, or from collection templates.
When a route is created, Gridmix:
- Resolves the component path.
- Parses component custom blocks through registered component parsers.
- Extracts the page query.
- Parses the GraphQL query against the current schema.
- Applies permalink/trailing-slash behavior.
- Builds a route regexp with `path-to-regexp`.
- Registers component/query file dependencies for development watching.
Page queries support pagination. During build, paginated static routes expand into multiple render queue entries based on total pages calculated from the store and GraphQL schema.
## Generated app files
`gridmix/lib/app/codegen/index.js` writes generated modules into `config.appCacheDir`, usually under `node_modules/.cache/gridmix/app`.
Generated files include:
- `icons.js`: icon metadata.
- `config.js`: client-consumable config.
- `routes.js`: Vue Router route definitions and lazy component imports.
- `constants.js`: runtime constants.
- `plugins-server.js`: runtime client-entry plugins whose normalized plugin `server` flag is `true`; this file is imported by the shared app module used by both SSR and browser bundles.
- `plugins-client.js`: runtime client-entry plugins whose normalized plugin `server` flag is `false`; this file is imported only by the browser entry.
- `now.js`: the current store update timestamp used by development updates.
Webpack resolves the `#gridmix` alias to this app cache directory. The app runtime imports generated modules through that alias.
## Runtime Vue app
The browser and server runtime live in `gridmix/app/`.
`gridmix/app/app.js` creates the shared Vue app factory:
- Imports generated `plugins-server.js` runtime entries.
- Imports project `src/main` and `src/App.vue`, with fallback files configured by webpack when they are missing.
- Installs the GraphQL mixin.
- Registers global `GLink`, `GImage`, and `ClientOnly` components.
- Adds `$url` and `$fetch` to `Vue.prototype`.
- Installs a router guard that fetches page data.
- Runs generated `plugins-server.js` entries at module initialization.
- Exports `runPlugins()`, `runMain()`, and `createApp()`, where `createApp()` returns `{ app, router }`.
`entry.client.js` is the browser entry:
- Installs directives for `g-link`, `g-image`, and link catching.
- Runs generated browser client plugins and project main.
- Creates the app and router.
- In production, adds a route guard that reloads the page if an async component chunk cannot be loaded.
- Installs global click catching when enabled.
- Mounts to `#app` when the router is ready.
`entry.server.js` is the SSR entry:
- Runs project main.
- Creates a fresh app/router pair for each render.
- Pushes the requested location into the router.
- Rejects unresolved routes.
- Resolves with the Vue app for `vue-server-renderer`.
`app/router.js` creates a Vue Router instance in history mode with generated routes and `process.env.PUBLIC_PATH` as the base. Routes added later through `router.addRoutes()` are marked as custom so the GraphQL guard skips automatic page-data fetching for them.
## Client data fetching
Each generated page has a JSON data file containing:
- `hash`: the current webpack/build hash.
- `data`: GraphQL page query results, or `null`.
- `context`: page context.
In static mode, `gridmix/app/fetch.js` fetches JSON from `process.env.DATA_URL`, validates that the JSON hash matches the document’s initial hash, and returns page data/context. Dynamic routes use `route.meta.dataPath`.
In development mode, `fetch.js` posts to `/___graphql` instead of reading static JSON. The dev GraphQL middleware executes the matched page query and attaches page context in the response extensions.
The GraphQL route guard stores fetched results in a shared client cache. The `$page` and `$context` computed properties from `app/graphql/mixin.js` read from SSR state on the server and from the client cache in the browser.
`Vue.prototype.$fetch` resolves a path through the router, fetches its data, caches it, and returns the result for browser-only use.
## Webpack compilation
`gridmix/lib/app/Compiler.js` owns webpack config generation and compiler creation.
It creates:
- A client config for both development and production.
- A server config only in production.
The compiler exposes Tapable hooks:
- `cacheIdentifier`: allows plugins to affect filesystem cache versioning.
- `chainWebpack`: allows plugins and project config to mutate the webpack-chain config.
- `done`: declared for compiler completion integrations.
Config generation starts with `gridmix/lib/webpack/createBaseConfig.js` and then applies client/server-specific settings.
The base config defines:
- Output path, filenames, chunk filenames, and public path.
- Aliases for `~`, `@`, `#gridmix`, and `gridmix$`.
- Fallbacks for missing project `src/main` and `src/App.vue`.
- Vue 2 loader setup with custom compiler modules for HTML/assets.
- Babel handling for JavaScript and TypeScript handling through esbuild-loader.
- CSS/PostCSS/preprocessor rules with either vue-style-loader in development or extracted CSS in production.
- Asset modules for images, SVG, media, and fonts.
- Special loaders for `g-image` and `g-link` resource queries.
- YAML loading.
- DefinePlugin values for public path, data URL, Node environment, GraphQL endpoint, client/server/static booleans, and `GRIDMIX_` environment variables.
- Filesystem cache configuration when enabled.
The client config adds `gridmix/app/entry.client.js`. In development it also adds `entry.dev-socket.js`, friendly errors, and no-emit-on-errors. In production it adds the Vue SSR client manifest plugin, CSS extraction/minimization, esbuild minimization, runtime chunking, deterministic module ids, and vendor/style chunk splitting.
The server config adds `gridmix/app/entry.server.js`, targets Node, externalizes Vue runtime packages, disables minification, emits a CommonJS2 bundle, and writes the Vue SSR server bundle manifest.
After webpack-chain hooks run, `configureWebpack` handlers and an optional project `webpack.config.js` are merged/applied. Gridmix rejects direct changes to `output.publicPath`; the configured `pathPrefix` is the source of that value.
## Development server flow
`gridmix/lib/develop.js` sets:
- `NODE_ENV=development`
- `GRIDMIX_MODE=serve`
It creates and bootstraps the app, empties the images directory, creates a webpack compiler from the client config, and starts webpack-dev-server.
The dev server:
- Serves the project `static` directory.
- Registers `/___explore` for the GraphQL explorer UI.
- Registers `/___graphql` for page query and GraphQL API requests.
- Registers an assets middleware for generated file/image assets.
- Lets plugins and project config customize the Express app through `configureServer`.
- Creates a WebSocket server on `/___echo` for Gridmix app broadcasts alongside webpack-dev-server’s own websocket endpoint.
During development, pages and filesystem sources install watchers. Store changes update the app timestamp, and `app.broadcast()` sends messages to connected clients and regenerates `now.js`.
## Production build flow
`gridmix/lib/build.js` sets:
- `NODE_ENV=production`
- `GRIDMIX_MODE=static`
It then:
- Creates and bootstraps the app.
- Runs `beforeBuild` plugin hooks.
- Empties the output directory unless disabled.
- Runs webpack with both client and server configs.
- Creates a static render queue from the registered pages/routes.
- Lets hooks adjust redirects and the render queue.
- Executes page GraphQL queries and writes JSON data files.
- Renders HTML files through worker processes and Vue SSR manifests.
- Copies queued files.
- Processes queued images.
- Copies the project `static` directory into the output directory.
- Runs `afterBuild` plugin hooks with context, config, queue, and redirects.
- Removes the manifest directory from the final output.
The render queue is created in `gridmix/lib/app/build/createRenderQueue.js`. Each render entry includes the router location, page path, HTML output path, JSON data output path, public path, current page number, route id, page id, and route type.
`executeQueries` validates each unique component page query once, executes it with variables derived from page context/current path/current page, writes `{ hash, data, context }` JSON files, and runs with physical-CPU concurrency.
HTML rendering is delegated to `gridmix/lib/workers/html-writer.js`, which creates a Vue bundle renderer from the server bundle and client manifest. `createRenderFn` renders the app to string, injects vue-meta output, resource hints, styles, scripts, and serialized state into the configured HTML template.
## Assets and images
The `AssetsQueue` owned by the app contains file and image queues. Loaders, components, and transformers can enqueue assets.
During production build:
- Queued files are copied from source paths to destination paths.
- Queued images are processed in chunks by the `image-processor` worker with concurrency based on logical CPU count.
- Existing images in the output images directory can be purged when they are no longer in the queue and `config.images.purge` is enabled.
During development, the assets middleware serves queued file/image assets from their generated asset paths.
## Optional plugin package patterns
Optional packages use the same plugin contract as project plugins.
Server-only plugins usually export `index.js` or `gridmix.server.js`. For example:
- `@gridmix/plugin-sitemap` registers page/build hooks in production and writes a sitemap during `afterBuild`.
- `@gridmix/plugin-critical` participates in build output processing for critical CSS.
Client/runtime plugins include a server entry to pass options into generated client plugin metadata and a client entry to install Vue behavior. For example:
- `@gridmix/plugin-google-analytics/gridmix.server.js` calls `api.setClientOptions(options)`.
- `@gridmix/plugin-google-analytics/gridmix.client.js` installs `vue-analytics` with the router and SSR/client flags.
Hybrid packages can combine source loading, schema customization, webpack rules, page creation, and client runtime behavior. `@gridmix/vue-remark` is the largest example: it creates Markdown file nodes, transforms Markdown to Vue SFC content, adds webpack rules for `.md`, extracts page queries from Markdown, creates pages, and can pass client options through generated plugin files.
## Testing and maintainer commands
The root package defines:
- `pnpm test:unit` for unit tests.
- `pnpm test:e2e` for end-to-end tests.
- `pnpm lint` for ESLint across `gridmix` and `packages`.
Tests live near the code they cover, especially under `gridmix/lib/**/__tests__` and `packages/cli/__tests__`. End-to-end project build tests live under `gridmix/lib/__tests__`.
