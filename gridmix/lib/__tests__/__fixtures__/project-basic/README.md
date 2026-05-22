# project-basic fixture

Test fixture used by `gridmix/lib/app/__tests__/index.spec.js` and other unit
tests. It mimics a minimal Gridmix project.

## Why is there a `node_modules/` directory in git?

`node_modules/plugin/` is **not** an installed dependency — it is a hand-written
plugin fixture that exists only to test plugin resolution (see the
`~/node_modules/plugin` reference in `gridmix.config.js`).

The root `.gitignore` ignores `node_modules`, but the four files under
`node_modules/plugin/` were force-added once with `git add -f`. Once tracked,
`.gitignore` no longer applies to them and they ship in the repo like any
other file.

If you ever delete this folder (e.g. with `npkill`), restore it with:

```sh
git restore gridmix/lib/__tests__/__fixtures__/project-basic/node_modules/
```

If you re-create the files from scratch, you must force-add them again:

```sh
git add -f gridmix/lib/__tests__/__fixtures__/project-basic/node_modules/plugin/
```
