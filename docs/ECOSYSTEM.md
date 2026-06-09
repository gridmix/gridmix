# Supported Gridmix ecosystem

Current Gridsome-to-Gridmix transition is based on the following foundational packages (and/or required by their package graph) for the first revival iterations and interested "consumers":

* `gridmix` — fyodor.io, gridsome website
* `@gridmix/cli` — `gridmix` (internally)
* `@gridmix/plugin-critical` — gridsome website
* `@gridmix/plugin-google-analytics` — gridsome website
* `@gridmix/remark-prismjs` — fyodor.io, gridsome website
* `@gridmix/source-filesystem` — fyodor.io, gridsome website
* `@gridmix/transformer-remark` — fyodor.io, gridsome website (depends on `gridmix` as a peer)
* `@gridmix/vue-remark` — gridsome website (depends on `@gridmix/source-filesystem` and `@gridmix/transformer-remark`, and on `gridmix` as a peer)

Remaining packages are not published (yet, until necessary), even though updated (at least partially):

* `@gridmix/plugin-sitemap` — clean
* `@gridmix/source-airtable` — depends on `gridmix` as a peer
* `@gridmix/source-contentful` — depends on `gridmix` as a peer
* `@gridmix/source-datocms` — clean
* `@gridmix/source-drupal` — clean
* `@gridmix/source-faker` — clean
* `@gridmix/source-ghost` — clean
* `@gridmix/source-graphql` — depends on `gridmix` as a peer
* `@gridmix/source-strapi` — clean
* `@gridmix/source-wordpress` — clean
* `@gridmix/transformer-csv` — clean
* `@gridmix/transformer-json` — clean
* `@gridmix/transformer-yaml` — clean

Publishing pipeline uses ignore list from `.changeset/config.json#ignore`.

Additionally, there are starters from the Gridsome legacy that are forked and either resurrected or planned for resurrection. They include:

* https://github.com/gridmix/gridmix-starter-default
* https://github.com/gridmix/gridmix-starter-markdown-blog
* https://github.com/gridmix/gridmix-starter-blog
* https://github.com/gridmix/gridmix-starter-docs
* https://github.com/gridmix/gridmix-starter-wordpress

As the final piece of the puzzle, the plugin for eslint, https://github.com/gridmix/eslint-plugin-gridmix, which may require separate attention and a dedicated effort after updating the ESLint setup for the monorepository itself.
