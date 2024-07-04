const config = require('../config')
const mysql = require('mysql')
const sqlite3 = require('sqlite3').verbose()

const engines = {
  undefined: 'sqlite3',
  test: 'sqlite3',
  development: 'mysql',
  production: 'mysql'
}

const engine = {
  sqlite3: new sqlite3.Database(':memory:'),
  mysql: mysql.createConnection(config.mysql)
}[engines[process.env.NODE_ENV]]

const db = module.exports = engine

if (engines[process.env.NODE_ENV] === 'mysql') {
  db.connect(function (err) {
    if (err) throw err
    console.log('connected to the database')
  })
}

db.healthCheck = function (cb) {
  const now = Date.now().toString()
  const createQuery = 'CREATE TABLE IF NOT EXISTS healthCheck (value TEXT)'
  const insertQuery = 'INSERT INTO healthCheck VALUES (?)'

  return executeQuery(createQuery, [], function (err) {
    if (err) return cb(err)
    return executeQuery(insertQuery, [now], function (err) {
      if (err) return cb(err)
      cb(null, now)
    })
  })
}

db.executeQuery = function (query, values) {
  return new Promise((resolve, reject) => {
    if (engines[process.env.NODE_ENV] === 'mysql') {
      return db.query(query, values, (err, data) => {
        if (err) {
          return reject(err)
        }
        resolve(data)
      })
    } else {
      // regex check if the query starts with SELECT or DELETE
      const isSelectOrDelete = /^(SELECT|DELETE)/i.test(query.trim())
      return db.serialize(() => {
        if (isSelectOrDelete) {
          db.all(query, values, (err, data) => {
            if (err) {
              return reject(err)
            }
            resolve(data)
          })
        } else {
          db.run(query, values, function (err) {
            if (err) {
              return reject(err)
            }
            resolve(this)
          })
        }
      })
    }
  })
}

function executeQuery (query, values, cb) {
  if (engines[process.env.NODE_ENV] === 'mysql') {
    return db.query(query, values, function (err, data) {
      if (err) return cb(err)
      cb(null, data)
    })
  }

  return db.serialize(function () {
    if (query.trim().toUpperCase().startsWith('SELECT') || query.trim().toUpperCase().startsWith('DELETE')) {
      db.all(query, values, function (err, data) {
        if (err) return cb(err)
        cb(null, data)
      })
    }

    db.run(query, values, function (err, data) {
      if (err) return cb(err)
      cb(null, data)
    })
  })
}
