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
