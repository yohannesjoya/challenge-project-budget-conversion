const express = require('express')

const {
  getBudgetById,
  getBudgetByYearAndName,
  insertBudget,
  updateBudget,
  deleteBudget
} = require('../controllers/budget-controller')

const projectRoutes = express.Router()

module.exports = projectRoutes

projectRoutes.get('/budget/:id', getBudgetById)
projectRoutes.post('/budget/currency', getBudgetByYearAndName)
projectRoutes.post('/budget', insertBudget)
projectRoutes.put('/budget/:id', updateBudget)
projectRoutes.delete('/budget/:id', deleteBudget)
