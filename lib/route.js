const express = require('express')

const {
  getBudgetById,
  getBudgetByYearAndName,
  insertBudget,
  updateBudget,
  deleteBudget
} = require('./budget-controller')
const { validateCreateBudgetDto, validateUpdateBudgetDto } = require('./dto-validation')
const { validateDtoMiddleware } = require('./mw')

const projectRoutes = express.Router()

module.exports = projectRoutes

projectRoutes.get('/budget/:id', getBudgetById)
projectRoutes.post('/budget/currency', getBudgetByYearAndName)
projectRoutes.post('/budget', validateDtoMiddleware(validateCreateBudgetDto), insertBudget)
projectRoutes.put('/budget/:id', validateDtoMiddleware(validateUpdateBudgetDto), updateBudget)
projectRoutes.delete('/budget/:id', deleteBudget)
