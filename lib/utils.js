const config = require('../config')

module.exports = {
  getExchangeRateAPI,
  generateSQLQueries,
  generateRequestOpts,
  toCamelCase
}

async function getExchangeRateAPI (currencyType) {
  const apiKey = config.currency.apiKey
  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
  const response = await fetch(url)
  if (!response.ok) {
    return null
  }
  const data = await response.json()
  const result = data.conversion_rates[`${currencyType}`]
  return result
}

function generateSQLQueries (tableName, data, id = null) {
  const fields = Object.keys(data)
  let query
  let record

  if (id) {
    // Update query
    const updateFields = fields.filter(field => field !== 'projectId').map(
      field => `${field} = ?`).join(', ')
    query = `UPDATE ${tableName} SET ${updateFields} WHERE projectId = ?;`

    record = [...fields.filter(field => field !== 'projectId').map(
      field => data[field]), id]
  } else {
    // Insert query
    const insertFields = fields.join(', ')
    const placeholders = fields.map(() => '?').join(', ')
    query = `INSERT INTO ${tableName} (${insertFields}) 
    VALUES (${placeholders});`

    record = fields.map(field => data[field])
  }

  return { query, record }
}

function generateRequestOpts (method, headers = false) {
  const requestOpts = {
    encoding: 'json',
    method,
    headers: headers ? { 'Content-Type': 'application/json' } : {}
  }
  return requestOpts
}

function toCamelCase (str) {
  return str
    .split(/[-_\s]+/) // Split string by '-', '_', or whitespace
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase()
      }
      return word.charAt(0).toUpperCase() +
      word.slice(1).toLowerCase()
    })
    .join('')
}
