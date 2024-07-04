process.env.NODE_ENV = 'test'

const http = require('http')
const test = require('tape')
const servertest = require('servertest')
const app = require('../lib/app')
const db = require('../lib/db')

const server = http.createServer(app)

const createTableSql = `
    CREATE TABLE IF NOT EXISTS project (
      projectId INT PRIMARY KEY,
      projectName VARCHAR(255),
      year INT,
      currency VARCHAR(3),
      initialBudgetLocal DECIMAL(10, 2),
      budgetUsd DECIMAL(10, 2),
      initialScheduleEstimateMonths INT,
      adjustedScheduleEstimateMonths INT,
      contingencyRate DECIMAL(5, 2),
      escalationRate DECIMAL(5, 2),
      finalBudgetUsd DECIMAL(10, 2)
    );
  `
const insertSql = `
      INSERT INTO project (
        projectId,
        projectName,
        year,
        currency,
        initialBudgetLocal,
        budgetUsd,
        initialScheduleEstimateMonths,
        adjustedScheduleEstimateMonths,
        contingencyRate,
        escalationRate,
        finalBudgetUsd
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `

test('GET /health should return 200', function (t) {
  servertest(server, '/health', { encoding: 'json' }, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 200, 'Should return 200')
    t.end()
  })
})

test('GET /api/ok should return 200', function (t) {
  servertest(server, '/api/ok', { encoding: 'json' }, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 200, 'Should return 200')
    t.ok(res.body.ok, 'Should return a body')
    t.end()
  })
})

test('GET /nonexistent should return 404', function (t) {
  servertest(server, '/nonexistent', { encoding: 'json' }, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 404, 'Should return 404')
    t.end()
  })
})

test('Setup test database', async function (t) {
  const testData = [
    [1, 'New Project 1', 2005, 'USD', 116974.00, 233724.23, 17, 32, 1.19, 3.25, 237303.15],
    [38, 'New Project 2', 2000, 'GBP', 871614.58, 142119.37, 13, 11, 2.09, 4.67, 445126.2]
  ]
  try {
    await db.executeQuery(createTableSql, [])
    for (let i = 0; i < testData.length; i++) {
      await db.executeQuery(insertSql, testData[i])
      t.pass(`Data inserted for record ${i + 1}`)
    }
    t.end()
  } catch (err) {
    t.fail('Error creating table and inserting data')
    t.end()
  }
})

test('GET /api/project/budget/:id tests', function (t) {
  t.test('Successful get by ID', function (st) {
    const opts = { encoding: 'json', method: 'GET' }
    servertest(server, '/api/project/budget/1', opts, async function (err, res) {
      st.error(err, 'No error')
      st.equal(res.statusCode, 200, 'Should return 200')
      st.equal(res.body.projectName, 'New Project 1', 'Project name should match')
      st.equal(res.body.year, 2005, 'Year should match')
      st.end()
    })
  })
  t.end()
})

test('GET /api/project/budget/:id tests Not Found', function (t) {
  t.test('Project not found', function (st) {
    const opts = { encoding: 'json', method: 'GET' }
    servertest(server, '/api/project/budget/999', opts, function (err, res) {
      st.error(err, 'No error')
      st.equal(res.statusCode, 404, 'Should return 404')
      st.end()
    })
  })
  t.end()
})

test('POST /api/project/budget/currency tests with USD', function (t) {
  t.test('Successful get by year and name in USD', function (st) {
    const opts = { encoding: 'json', method: 'POST', headers: { 'Content-Type': 'application/json' } }
    const req = servertest(server, '/api/project/budget/currency', opts, function (err, res) {
      st.error(err, 'No error')
      st.equal(res.statusCode, 200, 'Should return 200')
      st.ok(res.body.success, 'Should return success: true')
      st.equal(res.body.data[0].projectName, 'New Project 1', 'Project name should match')
      st.end()
    })
    req.write(JSON.stringify({ year: 2005, projectName: 'New Project 1', currency: 'USD' }))
    req.end()
  })
  t.end()
})

test('POST /api/project/budget/currency tests with Non-USD', function (t) {
  t.test('Successful retrieval by year and name in non-USD currency', function (st) {
    const opts = { encoding: 'json', method: 'POST', headers: { 'Content-Type': 'application/json' } }
    const req = servertest(server, '/api/project/budget/currency', opts, function (err, res) {
      st.error(err, 'No error')
      st.equal(res.statusCode, 200, 'Should return 200')
      st.ok(res.body.success, 'Should return success: true')
      st.equal(res.body.data[0].projectName, 'New Project 2', 'Project name should match')
      st.ok(res.body.data[0].finalBudgetEUR, 'Should have finalBudgetEUR: field')
      st.end()
    })
    req.write(JSON.stringify({ year: 2000, projectName: 'New Project 2', currency: 'EUR' }))
    req.end()
  })
  t.end()
})

test('POST /api/project/budget/currency tests NotFound', function (t) {
  t.test('Project not found', function (st) {
    const opts = { encoding: 'json', method: 'POST', headers: { 'Content-Type': 'application/json' } }
    const req = servertest(server, '/api/project/budget/currency', opts, function (err, res) {
      console.log()
      st.error(err, 'No error')
      st.equal(res.statusCode, 404, 'Should return 404')
      st.equal(res.body.success, false, 'Should return success: false')
      st.end()
    })
    req.write(JSON.stringify({ year: 2024, projectName: 'Nonexistent Project', currency: 'USD' }))
    req.end()
  })
  t.end()
})

test('Teardown test database', async function (t) {
  const dropTableSql = 'DROP TABLE project'
  try {
    db.executeQuery(dropTableSql, [], (err) => {
      if (err) {
        t.fail('Error dropping table')
        t.end()
      }
    })
    t.pass('Table dropped')
    t.end()
  } catch (err) {
    t.fail('Error dropping table')
    t.end()
  }
})
