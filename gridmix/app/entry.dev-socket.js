import fetch from './fetch'
import router from './router'
import { formatError, clearAllResults, setResults } from './graphql/shared'

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const sock = new WebSocket(`${protocol}//${window.location.host}/___echo`)

sock.onmessage = message => {
  const data = JSON.parse(message.data)

  switch (data.type) {
    case 'fetch':
      fetch(router.currentRoute, { force: true })
        .then(res => {
          if (res.errors) {
            formatError(res.errors[0], router.currentRoute)
          } else {
            clearAllResults(router.currentRoute.path)
            setResults(router.currentRoute.path, res)
          }
        })
        .catch(err => formatError(err, router.currentRoute))

      break
  }
}
