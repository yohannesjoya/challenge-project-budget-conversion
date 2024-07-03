const express = require('express')

const { getBudgetById } = require('../controllers/budget-controller')

const projectRoutes = express.Router()

module.exports = projectRoutes

projectRoutes.get('/budget/:id', getBudgetById)
