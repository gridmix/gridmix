'use strict'

function createStyle (codes) {
  const open = `\u001b[${codes}m`
  const close = '\u001b[0m'

  const style = (input) => `${open}${input}${close}`

  return new Proxy(style, {
    get (_, modifier) {
      const modifiers = {
        bold: '1',
        dim: '2',
        red: '31',
        green: '32',
        yellow: '33',
        cyan: '36',
        gray: '90',
        grey: '90',
        black: '30',
        bgGreen: '42',
        bgYellow: '43'
      }

      if (!(modifier in modifiers)) {
        return style[modifier]
      }

      const nextCodes = codes ? `${codes};${modifiers[modifier]}` : modifiers[modifier]
      return createStyle(nextCodes)
    }
  })
}

const chalk = new Proxy(createStyle('0'), {
  get (target, prop) {
    if (prop === 'default') {
      return chalk
    }

    const colors = {
      bold: '1',
      dim: '2',
      red: '31',
      green: '32',
      yellow: '33',
      cyan: '36',
      gray: '90',
      grey: '90',
      black: '30',
      bgGreen: '42',
      bgYellow: '43'
    }

    if (prop in colors) {
      return createStyle(colors[prop])
    }

    return target[prop]
  }
})

module.exports = chalk
module.exports.default = chalk
