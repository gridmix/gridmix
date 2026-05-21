# @gridmix/source-ghost

> Ghost source for Gridmix. This package is under development and API might change before v1 is released.

## Install

- `npm install @gridmix/source-ghost`
- `yarn add @gridmix/source-ghost`
- `pnpm install @gridmix/source-ghost`

## Usage

```js
module.exports = {
  plugins: [
    {
      use: '@gridmix/source-ghost',
      options: {
        typeName: 'Ghost',
        baseUrl: 'http://localhost:2368',
        contentKey: '0b7050113fba7147f358cc2f4d',
        version: 'v3' // default
      }
    }
  ],
  templates: {
    GhostPost: '/:year/:month/:day/:slug',
    GhostTag: '/tag/:slug'
  }
}
```
