process.env.NODE_ENV = 'test'

const http = require('http')
const test = require('tape')
const servertest = require('servertest')

const app = require('../lib/app')
const db = require('../lib/db')
const { generateRequestOpts } = require('../lib/utils')

const server = http.createServer(app)
const getRequestOpts = generateRequestOpts('GET')
const postRequestOpts = generateRequestOpts('POST', true)
const deleteRequestOpts = generateRequestOpts('DELETE', true)
const putRequestOpts = generateRequestOpts('PUT', true)

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
  servertest(server, '/health', { encoding: 'json' },
    function (err, res) {
      t.error(err, 'No error')
      t.equal(res.statusCode, 200, 'Should return 200')
      t.end()
    })
})

test('GET /api/ok should return 200', function (t) {
  servertest(server, '/api/ok', { encoding: 'json' },
    function (err, res) {
      t.error(err, 'No error')
      t.equal(res.statusCode, 200, 'Should return 200')
      t.ok(res.body.ok, 'Should return a body')
      t.end()
    })
})

test('GET /nonexistent should return 404', function (t) {
  servertest(server, '/nonexistent', { encoding: 'json' },
    function (err, res) {
      t.error(err, 'No error')
      t.equal(res.statusCode, 404, 'Should return 404')
      t.end()
    })
})

test('Setup test database', async function (t) {
  const testData = [
    [1, 'New Project 1', 2005, 'USD', 116974.00, 233724.23,
      17, 32, 1.19, 3.25, 237303.15],
    [38, 'New Project 2', 2000, 'GBP', 871614.58, 142119.37,
      13, 11, 2.09, 4.67, 445126.2]
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
    servertest(server, '/api/project/budget/1',
      getRequestOpts,
      async function (err, res) {
        st.error(err, 'No error')
        st.equal(res.statusCode, 200, 'Should return 200')
        st.equal(res.body.projectName, 'New Project 1', 'name match')
        st.equal(res.body.year, 2005, 'Year should match')
        st.end()
      })
  })
  t.end()
})

test('GET /api/project/budget/:id tests Not Found', function (t) {
  t.test('Project not found', function (st) {
    servertest(server, '/api/project/budget/999',
      getRequestOpts,
      function (err, res) {
        st.error(err, 'No error')
        st.equal(res.statusCode, 404, 'Should return 404')
        st.end()
      })
  })
  t.end()
})

test('DELETE /api/project/budget/:id tests', function (t) {
  t.test('Successful deletion of project budget', function (st) {
    servertest(server, '/api/project/budget/2',
      deleteRequestOpts,
      function (err, res) {
        st.error(err, 'No error')
        st.equal(res.statusCode, 200, 'Should return 200')
        st.equal(res.body.success, true, 'Should return success: true')
        st.end()
      })
  })
  t.end()
})

test('POST /api/project/budget/currency tests with USD', function (t) {
  t.test('Successful get by year and name in USD', function (st) {
    const req = servertest(server, '/api/project/budget/currency',
      postRequestOpts,
      function (err, res) {
        st.error(err, 'No error')
        st.equal(res.statusCode, 200, 'Should return 200')
        st.ok(res.body.success, 'Should return success: true')
        st.equal(res.body.data[0].projectName, 'New Project 1',
          'name match')
        st.end()
      })
    req.write(JSON.stringify({
      year: 2005, projectName: 'New Project 1', currency: 'USD'
    }))
    req.end()
  })
  t.end()
})

test('POST /api/project/budget/currency tests with Non-USD',
  function (t) {
    t.test('Successful retrieval by year and name in non-USD currency',
      function (st) {
        const req = servertest(server, '/api/project/budget/currency',
          postRequestOpts,
          function (err, res) {
            st.error(err, 'No error')
            st.equal(res.statusCode, 200, 'Should return 200')
            st.ok(res.body.success, 'Should return success: true')
            st.equal(res.body.data[0].projectName, 'New Project 2',
              'name match')
            st.ok(res.body.data[0].finalBudgetEur,
              'have finalBudgetEUR: field')
            st.end()
          })
        req.write(JSON.stringify({
          year: 2000, projectName: 'New Project 2', currency: 'EUR'
        }))
        req.end()
      })
    t.end()
  })

test('POST /api/project/budget/currency tests NotFound',
  function (t) {
    t.test('Project not found', function (st) {
      const req = servertest(server, '/api/project/budget/currency',
        postRequestOpts,
        function (err, res) {
          st.error(err, 'No error')
          st.equal(res.statusCode, 404,
            'Should return 404')
          st.equal(res.body.success, false,
            'Should return success: false')
          st.end()
        })
      req.write(JSON.stringify({
        year: 2024, projectName: 'Nonexistent Project', currency: 'USD'
      }))
      req.end()
    })
    t.end()
  })

test('POST /api/project/budget tests with validation error',
  function (t) {
    t.test('Dto Validation Error', function (st) {
      const invalidData = {
        projectName: 'New Project 3',
        year: 'kebe',
        currency: 'USD',
        initialBudgetLocal: 12340.50,
        budgetUsd: 139.24,
        initialScheduleEstimateMonths: 20,
        adjustedScheduleEstimateMonths: 11,
        contingencyRate: 3,
        escalationRate: 4,
        finalBudgetUsd: 405.01
      }

      const req = servertest(server, '/api/project/budget',
        postRequestOpts,
        function (err, res) {
          st.error(err, 'No error')
          st.equal(res.statusCode, 400, 'Should return 400')
          st.equal(res.body.errors.length, 2, 'Should return 2 errors')
          st.end()
        })

      req.write(JSON.stringify(invalidData))
      req.end()
    })
    t.end()
  })

test('POST /api/project/budget tests success', function (t) {
  t.test('Successful addition of project budget',
    function (st) {
      const newProject =
      {
        projectId: 20202,
        projectName: 'Humitas Hewlett Packard',
        year: 2005,
        currency: 'EUR',
        initialBudgetLocal: 316974.5,
        budgetUsd: 233724.23,
        initialScheduleEstimateMonths: 13,
        adjustedScheduleEstimateMonths: 12,
        contingencyRate: 2.19,
        escalationRate: 3.46,
        finalBudgetUsd: 247106.75
      }
      const req = servertest(server, '/api/project/budget',
        postRequestOpts,
        function (err, res) {
          st.error(err, 'No error')
          st.equal(res.statusCode, 201, 'Should return 201')
          st.ok(res.body.success, 'Should return success: true')
          st.end()
        })
      req.write(JSON.stringify(newProject))
      req.end()
    })
  t.end()
})

test('PUT /api/project/budget/:id tests with validation error',
  function (t) {
    t.test('Dto Validation failure ', function (st) {
      const invalidData = {
        projectId: 20000001,
        projectName: 'Updated Project Name',
        year: 2085,
        currency: 'EUR',
        initialBudgetLocal: 316974.5,
        budgetUsd: 233724.23,
        initialScheduleEstimateMonths: 13,
        adjustedScheduleEstimateMonths: 12,
        contingencyRate: 2.19,
        escalationRate: 3.46,
        finalBudgetUsd: 247106.75
      }

      const req = servertest(server, '/api/project/budget/1',
        putRequestOpts,
        function (err, res) {
          st.error(err, 'No error')
          st.equal(res.statusCode, 400, 'Should return 400')
          st.equal(res.body.errors.length, 1, 'Should return 2 errors')
          st.end()
        })

      req.write(JSON.stringify(invalidData))
      req.end()
    })
    t.end()
  })

test('PUT /api/project/budget/:id tests success', function (t) {
  t.test('Successful update of project budget', function (st) {
    const updatedProject = {
      projectName: 'Updated Project Name',
      year: 2085,
      currency: 'EUR',
      initialBudgetLocal: 316974.5,
      budgetUsd: 233724.23,
      initialScheduleEstimateMonths: 13,
      adjustedScheduleEstimateMonths: 12,
      contingencyRate: 2.19,
      escalationRate: 3.46,
      finalBudgetUsd: 247106.75
    }

    const req = servertest(server, '/api/project/budget/20202',
      putRequestOpts,
      function (err, res) {
        st.error(err, 'No error')
        st.equal(res.statusCode, 201, 'Should return 201')
        st.ok(res.body.success, 'Should return success: true')
        st.end()
      })
    req.write(JSON.stringify(updatedProject))
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

test('Setup test database again for 4 projects', async function (t) {
  const testDataForTtdApi = [
    [38, 'Llapingacho Instagram', 2000, 'GBP', 781688.85,
      402319.77, 19, 21, 3.09, 4.96, 435323.12],
    [321, 'Peking roasted duck Chanel', 2000, 'GBP', 767063.85,
      621610.48, 21, 19, 7.14, 3.58, 689836.03],
    [504, 'Choucroute Cartier', 2000, 'GBP', 848895.86,
      720265.74, 23, 21, 0.93, 2.88, 747900.78],
    [184, 'Rigua Nintendo', 2001, 'GBP', 448429.37,
      253943.51, 14, 12, 5.92, 3.04, 277153.87]
  ]
  try {
    await db.executeQuery(createTableSql, [])
    for (let i = 0; i < testDataForTtdApi.length; i++) {
      await db.executeQuery(insertSql, testDataForTtdApi[i])
      t.pass(`Data inserted for record ${i + 1}`)
    }
    t.end()
  } catch (err) {
    t.fail('Error creating table and inserting data')
    t.end()
  }
})

test('POST /api-conversion tests', function (t) {
  t.test('Successful conversion of project budgets to TTD',
    function (st) {
      servertest(server, '/api-conversion',
        getRequestOpts,
        function (err, res) {
          st.error(err, 'No error')
          st.equal(res.statusCode, 200, 'Should return 200')
          st.ok(res.body.success, 'return success: true')
          st.equal(res.body.data.length, 4, 'return four projects')
          res.body.data.forEach(project => {
            st.ok(project.finalBudgetTtd, 'have finalBudgetTtd field')
          })
          st.end()
        })
    })
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
