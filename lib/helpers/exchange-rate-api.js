const config = require('../../config')

module.exports = getExchangeRateAPI

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
