const db = require('./db')
const { getExchangeRateAPI, generateSQLQueries } = require('./utils')

module.exports = {
  getBudgetById,
  getBudgetByYearAndName,
  insertBudget,
  updateBudget,
  deleteBudget,
  convertCurrenciestoTTD
}

async function getBudgetById (req, res) {
  try {
    const id = req.params.id
    const query = 'SELECT * FROM project WHERE projectId=?;'
    const results = await db.executeQuery(query, [id])
    if (results.length === 0) {
      return res.status(404).json({
        success: false, error: 'Not Found'
      })
    }
    return res.status(200).json(results[0])
  } catch (error) {
    return res.status(500).json({
      success: false, error: 'Internal Server Error'
    })
  }
}

async function getBudgetByYearAndName (req, res) {
  try {
    const { year, projectName, currency } = req.body
    const query = 'SELECT * FROM project WHERE year=? AND projectName=?;'
    const results = await db.executeQuery(query, [year, projectName])
    if (results.length === 0) {
      return res.status(404).json({
        success: false, error: 'Not Found'
      })
    }
    const latestExchangeRate = await getExchangeRateAPI(currency)

    if (currency === 'USD' || !latestExchangeRate) {
      return res.status(200).json({ success: true, data: results })
    }
    results.forEach((project) => {
      project[`finalBudget${currency}`] =
        parseFloat((project.finalBudgetUsd * latestExchangeRate)
          .toFixed(2))
    })
    return res.status(200).json({
      success: true, data: results
    })
  } catch (error) {
    return res.status(500).json({
      success: false, error: 'Internal Server Error'
    })
  }
}

async function insertBudget (req, res) {
  try {
    const data = req.body
    const {
      query: insertQuery,
      record: insertRecord
    } = generateSQLQueries('project', data)

    await db.executeQuery(insertQuery, insertRecord)
    return res.status(201).json({ success: true })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json(
        {
          success: false, error: 'Cannot insert Duplicated row'
        })
    }
    return res.status(500).json({
      success: false, error: 'Internal Server Error'
    })
  }
}

async function updateBudget (req, res) {
  try {
    const data = req.body
    const id = req.params.id
    const {
      query: updateQuery,
      record: updateRecord
    } = generateSQLQueries('project', data, id)
    await db.executeQuery(updateQuery, updateRecord)
    return res.status(201).json({ success: true })
  } catch (error) {
    return res.status(500).json({
      success: false, error: 'Internal Server Error'
    })
  }
}

async function deleteBudget (req, res) {
  try {
    const id = req.params.id

    const deletequery = 'DELETE FROM project WHERE projectId=?'
    await db.executeQuery(deletequery, [id])
    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(500).json({
      success: false, error: 'Internal Server Error'
    })
  }
}

async function convertCurrenciestoTTD (req, res) {
  try {
    const projectsToConvert = [
      'Peking roasted duck Chanel', 'Choucroute Cartier',
      'Rigua Nintendo', 'Llapingacho Instagram'
    ]
    const placeholder = projectsToConvert.map(() => '?').join(', ')
    const query = `SELECT * FROM project 
    WHERE projectName IN (${placeholder});`

    const results = await db.executeQuery(query, projectsToConvert)
    const latestTtdRate = await getExchangeRateAPI('TTD')

    if (!latestTtdRate) {
      return res.status(500).json(
        {
          success: false,
          error: 'No exchange rate available now, try again later'
        })
    }

    results.forEach((data) => {
      data.finalBudgetTtd =
        parseFloat((data.finalBudgetUsd * latestTtdRate)
          .toFixed(2))
    })
    return res.status(200).json({ success: true, data: results })
  } catch (error) {
    return res.status(500).json({
      success: false, error: 'Internal Server Error'
    })
  }
}
