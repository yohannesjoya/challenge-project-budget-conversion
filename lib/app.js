const express = require('express')
const mw = require('./mw')

const app = express()
const endpoints = require('./endpoint')

const {
  convertCurrenciestoTTD
} = require('./budget-controller')

app.use(mw.cors)
app.use(mw.logger)
app.use(mw.bodyParser)
app.use(mw.health)

app.use('/api', endpoints)
app.get('/api-conversion', convertCurrenciestoTTD)

app.options('*', mw.cors)

app.use('*', (_req, res) => {
  res.status(404).send({ error: 'Not found' })
})

app.use((error, _req, res) => {
  res.status(500).send({ error })
})

module.exports = app
