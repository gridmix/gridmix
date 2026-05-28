const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gridmix GraphQL Explorer</title>
    <link rel="icon" href="https://avatars0.githubusercontent.com/u/17981963?s=200&v=4" />
    <link
      rel="stylesheet"
      href="https://esm.sh/graphiql@5.2.2/dist/style.css"
      crossorigin="anonymous"
    />
    <style>body { margin: 0; } #graphiql { height: 100dvh; } .loading { padding: 1rem; font-family: sans-serif; }</style>
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@19.2.5",
          "react/": "https://esm.sh/react@19.2.5/",
          "react-dom": "https://esm.sh/react-dom@19.2.5",
          "react-dom/": "https://esm.sh/react-dom@19.2.5/",
          "graphiql": "https://esm.sh/graphiql@5.2.2?standalone&external=react,react-dom,@graphiql/react,graphql",
          "graphiql/": "https://esm.sh/graphiql@5.2.2/",
          "@graphiql/react": "https://esm.sh/@graphiql/react@0.37.3?standalone&external=react,react-dom,graphql,@graphiql/toolkit,@emotion/is-prop-valid",
          "@graphiql/toolkit": "https://esm.sh/@graphiql/toolkit@0.11.3?standalone&external=graphql",
          "graphql": "https://esm.sh/graphql@16.13.2",
          "@emotion/is-prop-valid": "data:text/javascript,"
        }
      }
    </script>
    <script type="module">
      import React from 'react';
      import ReactDOM from 'react-dom/client';
      import { GraphiQL } from 'graphiql';
      import { createGraphiQLFetcher } from '@graphiql/toolkit';
      import 'graphiql/setup-workers/esm.sh';

      const fetcher = createGraphiQLFetcher({ url: '/___graphql' });
      const root = ReactDOM.createRoot(document.getElementById('graphiql'));
      root.render(React.createElement(GraphiQL, { fetcher }));
    </script>
  </head>
  <body>
    <div id="graphiql"><div class="loading">Loading…</div></div>
  </body>
</html>`

module.exports = () => (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end(html)
}
