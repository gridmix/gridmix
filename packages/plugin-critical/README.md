# @gridmix/plugin-critical

> Extracts & inlines critical-path (above-the-fold) CSS

## Install

- `npm install @gridmix/plugin-critical`
- `yarn add @gridmix/plugin-critical`
- `pnpm install @gridmix/plugin-critical`

## Usage

```js
module.exports = {
  plugins: [
    {
      use: '@gridmix/plugin-critical',
      options: {
        paths: ['/'],
        width: 1300,
        height: 900
      }
    }
  ]
}
```
