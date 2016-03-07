# pull-http [![stability][0]][1]
[![npm version][2]][3] [![build status][4]][5] [![test coverage][6]][7]
[![downloads][8]][9] [![js-standard-style][10]][11]

Http pull-stream functions. Useful for composing middleware in high throughput
servers.

## Usage
```js
const serverRouter = require('server-router')
const summary = require('server-summary')
const browserify = require('browserify')
const pullHttp = require('./pull-http')
const logHttp = require('http-ndjson')
const pull = require('pull-stream')
const bankai = require('bankai')
const bole = require('bole')
const http = require('http')
const path = require('path')

const clientp = path.join(__dirname, 'client-main.js')
const log = bole('main')

createServer({ port: 1337, logLevel: 'debug' })

function createServer (argv) {
  bole.output({ level: argv.logLevel, stream: process.stdout })
  const router = createRouter()
  const server = http.createServer(function (req, res) {
    const setSize = logHttp(req, res, log.debug)
    const source = pullHttp.createSource(req, res)
    const through = router(req, res, setSize)
    const sink = pullHttp.createSink(req, res, setSize)
    pull(source, through, sink)
  })
  server.listen(argv.port, summary(server))
}

function createRouter () {
  const router = serverRouter('/404')
  router.on('/', pullHttp.intercept(bankai.html()))
  router.on('/bundle.css', pullHttp.intercept(bankai.css()))
  router.on('/bundle.js', pullHttp.intercept(bankai.js(browserify, clientp)))
  return router
}
```

## API
### pullHttp.createSource(req, res)
Create a new source stream from an HTTP request. Attempts to parse JSON if
content type is `application/json`.

### pullHttp.createSink(req, res)
Creates a new sink stream. Sends errors if an error is detected. Sends JSON if
any data is passed. If no data is passed, it acts as a noop sink, expecting an
earlier stream to handle `res.end()`.

### pullHttp.intercept(httpFn) -> routerFn(req, res, params, setSize)
Wrap a Node stream behind a router to send data, and handle its own `res.end()`
call. [more docs tbi]

## Installation
```sh
$ npm install pull-http
```

## See Also
- [dominictarr/pull-stream](https://github.com/dominictarr/pull-stream)
- [raynos/error](https://github.com/Raynos/error)
- [node/http](https://nodejs.org/api/http.html)

## License
[MIT](https://tldrlegal.com/license/mit-license)

[0]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[1]: https://nodejs.org/api/documentation.html#documentation_stability_index
[2]: https://img.shields.io/npm/v/pull-http.svg?style=flat-square
[3]: https://npmjs.org/package/pull-http
[4]: https://img.shields.io/travis/yoshuawuyts/pull-http/master.svg?style=flat-square
[5]: https://travis-ci.org/yoshuawuyts/pull-http
[6]: https://img.shields.io/codecov/c/github/yoshuawuyts/pull-http/master.svg?style=flat-square
[7]: https://codecov.io/github/yoshuawuyts/pull-http
[8]: http://img.shields.io/npm/dm/pull-http.svg?style=flat-square
[9]: https://npmjs.org/package/pull-http
[10]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[11]: https://github.com/feross/standard
