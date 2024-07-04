const express = require('express')
const projectRoutes = require('./route')

const endpoints = express.Router()
module.exports = endpoints

endpoints.get('/ok', (req, res) => {
  res.status(200).json({ ok: true })
})

endpoints.use('/project', projectRoutes)
