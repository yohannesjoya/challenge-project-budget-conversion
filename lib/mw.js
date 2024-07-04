const healthpoint = require('healthpoint')
const bodyParser = require('body-parser')
const pinoLogger = require('express-pino-logger')
const db = require('./db')
const cors = require('cors')()
const { version } = require('../package.json')

const hp = healthpoint({ version }, db.healthCheck)

module.exports = {
  cors,
  health,
  logger: logger(),
  bodyParser: bodyParser.json({ limit: '5mb' }),
  validateDtoMiddleware
}

function logger () {
  return pinoLogger({
    level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
    redact: [
      'res.headers["set-cookie"]',
      'req.headers.cookie',
      'req.headers.authorization'
    ]
  })
}

function health (req, res, next) {
  req.url === '/health' ? hp(req, res) : next()
}

function validateDtoMiddleware (validationFn) {
  return (req, res, next) => {
    const { valid, errors } = validationFn(req.body)

    if (!valid) {
      return res.status(400).json({ success: false, errors })
    }

    next()
  }
}
