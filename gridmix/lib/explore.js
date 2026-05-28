// Deprecation shim: lib/server/Server.js was removed upstream in gridsome
// PR #1470 (Aug 2021); the playground now lives on `gridmix develop` at
// /___explore. Kept as an alias to preserve the documented CLI surface.
const chalk = require('./utils/chalk')

module.exports = async (context, args) => {
  console.log()
  console.log(`  ${chalk.yellow('Notice:')} ${chalk.cyan('gridmix explore')} is deprecated.`)
  console.log(`  Starting the dev server — open ${chalk.cyan('/___explore')} to use the playground.`)
  console.log()
  return require('./develop')(context, args)
}
