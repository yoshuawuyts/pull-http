const sendError = require('send-data/error')
const sendJson = require('send-data/json')
const sizeStream = require('size-stream')
const parseJson = require('body/json')
const pumpify = require('pumpify')

const jsonType = 'application/json'

// parse data from source
exports.createSource = function createSource (req, res) {
  var done = false

  return function (end, cb) {
    if (end) return cb(({ body: new Error(end) }))
    if (done) return cb(true)

    const contentType = req.headers['content-type'] || ''

    if (contentType.indexOf(jsonType) !== -1) {
      parseJson(req, res, function (err, data) {
        if (err) {
          return cb({ statusCode: 400, body: new Error('Invalid JSON') })
        }
        done = true
        cb(null, data)
      })
    } else {
      done = true
      cb(null, null)
    }
  }
}

// send data / errors / or nothing
exports.createSink = function createSink (req, res) {
  return function (read) {
    read(null, function next (end, data) {
      if (end === true) return
      else if (end) return sendError(req, res, end)
      else if (data) {
        sendJson(req, res, data)
        read(null, next)
      } else {
        // not sending JSON, expecting res.end()
        // to be called from a prior sink
        read(null, next)
      }
    })
  }
}

// create a end through stream that can send its own data
exports.intercept = function through (httpFn) {
  return function (req, res, params, setSize) {
    return function writable (read) {
      return function readable (end, cb) {
        read(end, function (end, data) {
          if (end === true) return cb(true)
          if (end) return cb(end)
          const getSize = sizeStream()
          getSize.once('size', setSize)
          const sink = pumpify(getSize, res)
          httpFn(req, res).pipe(sink)
          cb(null, null)
        })
      }
    }
  }
}
