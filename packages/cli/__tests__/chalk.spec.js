const { execFileSync } = require('child_process')
const path = require('path')

const wrapperPath = path.resolve(__dirname, '../lib/utils/chalk.js')
const ANSI_ESCAPE = /\u001b\[[0-9;]*m/

test('loads chalk 5 through the CJS wrapper in Node', () => {
  const output = execFileSync(process.execPath, ['-e', `
    const chalk = require(${JSON.stringify(wrapperPath)});
    if (typeof chalk.bold !== 'function') throw new Error('missing bold helper');
    process.stdout.write(chalk.red(chalk.bold('styled')));
  `], {
    env: { ...process.env, FORCE_COLOR: '1' },
    encoding: 'utf8'
  })

  expect(output).toMatch(ANSI_ESCAPE)
})
