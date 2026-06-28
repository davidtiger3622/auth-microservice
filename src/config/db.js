const { Pool } = require('pg')
const { db } = require('./env')

const pool = new Pool({
  host: db.host,
  port: db.port,
  database: db.name,
  user: db.user,
  password: db.password,
})

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database')
})

pool.on('error', (err) => {
  console.error('Unexpected database error', err)
  process.exit(-1)
})

module.exports = pool
