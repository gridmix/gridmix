# @gridmix/source-datocms

> DatoCMS source for Gridmix. This package is under development and
API might change before v1 is released.

## Install

- `npm install @gridmix/source-datocms`
- `yarn add @gridmix/source-datocms`
- `pnpm install @gridmix/source-datocms`

## Usage

```js
module.exports = {
  plugins: [
    {
      use: '@gridmix/source-datocms',
      options: {
        apiToken: 'YOUR_READONLY_API_TOKEN', // required
        previewMode: false,
        apiUrl: 'https://site-api.datocms.com',
        typeName: 'DatoCms'
      }
    }
  ]
}
```
