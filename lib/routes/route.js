const express = require('express')

const { getBudgetById, getBudgetByYearAndName } = require('../controllers/budget-controller')

const projectRoutes = express.Router()

module.exports = projectRoutes

projectRoutes.get('/budget/:id', getBudgetById)
projectRoutes.post('/budget/currency', getBudgetByYearAndName)
