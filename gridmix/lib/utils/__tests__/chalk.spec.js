const { execFileSync } = require('child_process')
const path = require('path')

const wrapperPath = path.resolve(__dirname, '../chalk.js')
const ANSI_ESCAPE = /\u001b\[[0-9;]*m/

function runInNode (script) {
  return execFileSync(process.execPath, ['-e', script], {
    env: { ...process.env, FORCE_COLOR: '1' },
    encoding: 'utf8'
  })
}

test('loads chalk 5 through the CJS wrapper in Node', () => {
  const output = runInNode(`
    const chalk = require(${JSON.stringify(wrapperPath)});
    if (typeof chalk.red !== 'function') throw new Error('missing red helper');
    process.stdout.write(chalk.red('styled'));
  `)

  expect(output).toMatch(ANSI_ESCAPE)
})

test('supports chained and bracket styles used across gridmix', () => {
  const output = runInNode(`
    const chalk = require(${JSON.stringify(wrapperPath)});
    process.stdout.write([
      chalk.green.bold('a'),
      chalk.bgYellow.black('b'),
      chalk['dim']('c')
    ].join('|'));
  `)

  expect(output).toMatch(ANSI_ESCAPE)
})
