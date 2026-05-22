exports.isGridmixProject = (pkgPath) => {
  const projectPkgJson = pkgPath ? require(pkgPath) : {}
  const { devDependencies = {}, dependencies = {}} = projectPkgJson
  const packages = { ...devDependencies, ...dependencies }

  return packages.hasOwnProperty('gridmix')
}
