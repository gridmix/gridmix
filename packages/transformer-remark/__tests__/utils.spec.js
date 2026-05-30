const path = require('path')
const os = require('os')
const fs = require('fs')
const { createPlugins } = require('../lib/utils')

test('resolves user remark plugins from the project context', () => {
  const context = fs.mkdtempSync(path.join(os.tmpdir(), 'gridmix-remark-plugin-'))
  const pluginDir = path.join(context, 'node_modules/remark-plugin-project-only')

  fs.mkdirSync(pluginDir, { recursive: true })
  fs.writeFileSync(path.join(pluginDir, 'index.js'), `
    module.exports = function projectOnlyPlugin () {}
  `)

  const plugins = createPlugins({
    useBuiltIns: false,
    plugins: ['remark-plugin-project-only']
  }, {}, context)

  expect(plugins).toHaveLength(1)
  expect(plugins[0][0].name).toEqual('projectOnlyPlugin')
})
