# @gridmix/source-strapi

> [Strapi](https://strapi.io/) source for Gridmix

## Install

- `npm install @gridmix/source-strapi`
- `yarn add @gridmix/source-strapi`
- `pnpm install @gridmix/source-strapi`

## Usage

```js
export default {
  plugins: [
    {
      use: '@gridmix/source-strapi',
      options: {
        apiURL: 'http://localhost:1337',
        queryLimit: 1000, // Defaults to 100
        contentTypes: ['article', 'user'],
        singleTypes: ['impressum'],
        // Possibility to login with a Strapi user,
        // when content types are not publicly available (optional).
        loginData: {
          identifier: '',
          password: ''
        }
      }
    }
  ]
}
```
