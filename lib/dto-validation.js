const validator = require('validator')

module.exports = { validateBudgetDto, validateCreateBudgetDto, validateUpdateBudgetDto }

function validateBudgetDto (data) {
  const errorList = []
  if (!data.projectName ||
    !validator.isLength(data.projectName, { min: 1 })) {
    errorList.push('Invalid or missing projectName')
  }
  if (!data.year || !validator.isInt(String(data.year))) {
    errorList.push('Invalid or missing year')
  }
  if (!data.currency ||
    !validator.isLength(data.currency, { min: 1 })) {
    errorList.push('Invalid or missing currency')
  }
  if (!data.initialBudgetLocal ||
    !validator.isFloat(String(data.initialBudgetLocal))) {
    errorList.push('Invalid or missing initialBudgetLocal')
  }
  if (!data.budgetUsd ||
    !validator.isFloat(String(data.budgetUsd))) {
    errorList.push('Invalid or missing budgetUsd')
  }
  if (!data.initialScheduleEstimateMonths ||
    !validator.isFloat(String(data.initialScheduleEstimateMonths))) {
    errorList.push('Invalid or missing initialScheduleEstimateMonths')
  }
  if (!data.adjustedScheduleEstimateMonths ||
    !validator.isFloat(String(data.adjustedScheduleEstimateMonths))) {
    errorList.push('Invalid or missing adjustedScheduleEstimateMonths')
  }
  if (!data.contingencyRate ||
    !validator.isFloat(String(data.contingencyRate))) {
    errorList.push('Invalid or missing contingencyRate')
  }
  if (!data.escalationRate ||
    !validator.isFloat(String(data.escalationRate))) {
    errorList.push('Invalid or missing escalationRate')
  }
  if (!data.finalBudgetUsd ||
    !validator.isFloat(String(data.finalBudgetUsd))) {
    errorList.push('Invalid or missing finalBudgetUsd')
  }

  if (errorList.length > 0) {
    return { valid: false, errors: errorList }
  }

  return { valid: true }
}

function validateCreateBudgetDto (data) {
  const errorList = []
  const baseDtoValidation = validateBudgetDto(data)

  if (!baseDtoValidation.valid) {
    baseDtoValidation.errors.forEach(element => {
      errorList.push(element)
    })
  }

  if (!data.projectId ||
    !validator.isInt(String(data.projectId))) {
    errorList.push('Invalid or missing projectId')
  }

  if (errorList.length > 0) {
    return { valid: false, errors: errorList }
  }

  return { valid: true }
}

function validateUpdateBudgetDto (data) {
  const errorList = []
  const baseDtoValidation = validateBudgetDto(data)
  if (!baseDtoValidation.valid) {
    baseDtoValidation.errors.forEach(element => {
      errorList.push(element)
    })
  }
  if (data.projectId) {
    errorList.push('Can not Update projectId')
  }
  if (errorList.length > 0) {
    return { valid: false, errors: errorList }
  }
  return { valid: true }
}
