const path = require('path')

const runCLI = require('./utils/helpers')

test('show @gridmix/cli version', async () => {
  const { stdout } = await runCLI(['-v'])

  expect(stdout).toMatch(/@gridmix\/cli v(\d+\.?){3}/)
})

test('show local gridmix version', async () => {
  const testPath = path.join(__dirname, '__fixtures__', 'project')
  const { stdout } = await runCLI(['-v'], { cwd: testPath })

  expect(stdout).toMatch(/gridmix v(\d+\.?){3}/)
})

test('warn about unknown command', async () => {
  const { stdout } = await runCLI(['asdf'])

  expect(stdout).toMatch('Unknown command asdf')
})

test('suggest matching command', async () => {
  const { stdout } = await runCLI(['creaet'])

  expect(stdout).toContain('Did you mean create?')
})
