const db = require('../db')
module.exports = {
  getBudgetById,
  getBudgetByYearAndName
}

async function getBudgetById (req, res) {
  try {
    const id = req.params.id
    const query = 'SELECT * FROM project WHERE projectId=?;'
    db.query(query, [id], (err, results) => {
      if (err) {
        return res.status(404).json({ success: false, error: 'Not Found' })
      }
      return res.status(200).json(results[0])
    })
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal Server Error' })
  }
}

async function getBudgetByYearAndName (req, res) {
  try {
    const { year, projectName, currency } = req.body
    const query = 'SELECT * FROM project WHERE year=? AND projectName=?;'
    db.query(query, [year, projectName], (err, results) => {
      if (err) {
        return res.status(404).json({ success: false, error: 'Not Found' })
      }
      return res.status(200).json({ success: true, data: results })
    })
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal Server Error' })
  }
}
