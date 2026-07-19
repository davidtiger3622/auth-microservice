const pool = require('../src/config/db')

const clearDatabase = async () => {
  await pool.query('DELETE FROM email_verification_tokens')
  await pool.query('DELETE FROM password_reset_tokens')
  await pool.query('DELETE FROM refresh_tokens')
  await pool.query('DELETE FROM users')
}

module.exports = { clearDatabase }
