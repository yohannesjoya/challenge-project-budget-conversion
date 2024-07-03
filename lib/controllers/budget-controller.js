const db = require('../db')
module.exports = {
  getBudgetById
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
