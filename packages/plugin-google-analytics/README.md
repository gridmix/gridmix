# @gridmix/plugin-google-analytics

> Google Analytics plugin for Gridmix

See [VueAnalytics](https://github.com/MatteoGabriele/vue-analytics/blob/master/README.md) for possible options.

## Install

- `npm install @gridmix/plugin-google-analytics`
- `yarn add @gridmix/plugin-google-analytics`
- `pnpm install @gridmix/plugin-google-analytics`

## Usage

Add the below config in your `gridmix.config.js`

```js
module.exports = {
  plugins: [
    {
      use: '@gridmix/plugin-google-analytics',
      options: {
        id: 'UA-XXXXXXXXX-X'
      }
    }
  ]
}
```
