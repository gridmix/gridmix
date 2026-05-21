# @gridmix/cli

> A command line tool for creating new Gridmix projects.

## Installation

Install globally with

- `npm install --global @gridmix/cli`
- `yarn global add @gridmix/cli`
- `pnpm install --global @gridmix/cli`

## Creating new projects

Run `gridmix create {name} {starter}` to create a new Gridmix project.

- **name** - directory name to create the project in
- **starter** - optional starter kit name

| Official starter kits |                                         |
| --------------------- | --------------------------------------- |
| Default               | `gridmix create my-website`            |
| WordPress             | `gridmix create my-blog wordpress`     |

## Start local development

Run `gridmix develop` inside the project directory to start a local development server.
The server will start at `http://localhost:8080/` with hot-reloading etc.

## Explore GraphQL schema and data

Run `gridmix explore` to start [GraphQL Playground](https://github.com/prisma/graphql-playground)
and explore your schema or data. Open your browser and go to `http://localhost:8080/___explore`
to start exploring.

## Build for production

Run `gridmix build` to generate a static site inside a `dist` directory in your project.
