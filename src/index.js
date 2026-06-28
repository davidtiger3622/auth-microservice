require('dotenv').config()
const app = require('./app')
const { port } = require('./config/env')
const pool = require('./config/db')

const start = async () => {
  try {
    await pool.query('SELECT 1')
    app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
