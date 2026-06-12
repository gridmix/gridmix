# 🎛️ Gridmix

[![npm version](https://badge.fury.io/js/gridmix.svg?icon=si%3Anpm)](https://badge.fury.io/js/gridmix)

**Gridmix** is an independent continuation of the [Gridsome](https://github.com/gridsome/gridsome) Vue.js static site generator, originally created by Tommy Vedvik and Hans-Jørgen Vedvik. The original project has been inactive since 2022; Gridmix modernizes the codebase for current Node.js and tooling, with the goal of keeping Gridsome-built sites maintainable. This is an independent fork — it has no affiliation with or endorsement from the original Gridsome maintainers. Original code is MIT-licensed and remains so here.

> This project is under active alpha-stage development. Use it at your own risk (_and pleasure_).

## Quick start

### 1. Install Gridmix CLI tool

- `npm install --global @gridmix/cli`
- `yarn global add @gridmix/cli`
- `pnpm install --global @gridmix/cli`

### 2. Create a Gridmix project

1. `gridmix create my-gridmix-site` to create a new project
2. `cd my-gridmix-site` to open the folder
3. `gridmix develop` to start a local dev server at `http://localhost:8080`
4. Happy coding 🎉🙌

### 3. Next steps

1. Create `.vue` components in the `./src/pages` directory to create pages
2. Use `gridmix build` to generate static files in a `./dist` folder

### Learn more

- [How it works](https://gridmix.github.io/docs/how-it-works/)
- [How to deploy](https://gridmix.github.io/docs/deployment/)

## State of the ecosystem

At the moment, not all the packages transitioned from the Gridsome ecosystem are tested/published on `npm`. The up-to-date list of the maintained artifacts is available in [**ECOSYSTEM.md**](./docs/ECOSYSTEM.md) 

## Versioning & releases

This monorepo uses [Changesets](https://github.com/changesets/changesets) with **independent per-package versioning**, released locally from `main` by a maintainer. The `playground` workspace is private and never published.

If your change should ship, author a changeset alongside it:

```bash
pnpm changeset
```

Pick the affected packages, choose `patch` / `minor` / `major` per package, write a short user-facing summary, and commit the generated `.changeset/*.md` file with your code change.

See [**RELEASING.md**](./docs/RELEASING.md) for the full flow: cutting releases, alpha/beta prerelease channels, conventions, migration notes from Lerna, and the path to automated release CI.

## Testing

Two automated suites — `pnpm test:unit` and `pnpm test:e2e` — cover most behavior. See [**TESTING.md**](./docs/TESTING.md) for what each suite covers and the list of manual verification recipes used until an entry can be promoted to e2e.

## Architecture

See [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) for a current-state overview of the monorepo packages, CLI flow, app bootstrap, plugin entrypoints, data store, GraphQL schema generation, page creation, webpack builds, and static rendering.

## Dependency updates

Renovate runs in dashboard-approval mode and Socket.dev gates per-PR supply-chain risk; updates and CVE triage are driven through the [Dependency Dashboard issue](https://github.com/gridmix/gridmix/issues/1). See [**RENOVATE.md**](./docs/RENOVATE.md) for the workflow, the three exits for each item (resolve / override+defer / defer cleanly), and the end-of-stage override sweep tied to the staged renewal.

## Migration issues

Errors found during migrating Gridsome consumers to Gridmix can be found in [**ERRATA.md**](./docs/ERRATA.md) and should be taken into account during following codebase polishing/updates.

## How to Contribute

Start with [the official guide](https://gridmix.github.io/docs/how-to-contribute/) and [CONTRIBUTING.md](./CONTRIBUTING.md). In the interest of fostering an open and welcoming environment please also read and follow the project's [Code of Conduct](./CODE_OF_CONDUCT.md).
