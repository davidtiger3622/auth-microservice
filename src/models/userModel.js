const pool = require('../config/db')

const createUser = async (email, hashedPassword) => {
  const result = await pool.query(
    'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at',
    [email, hashedPassword]
  )
  return result.rows[0]
}

const findUserByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  )
  return result.rows[0]
}

const findUserById = async (id) => {
  const result = await pool.query(
    'SELECT id, email, is_verified, created_at FROM users WHERE id = $1',
    [id]
  )
  return result.rows[0]
}

const saveRefreshToken = async (userId, token, expiresAt) => {
  const result = await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *',
    [userId, token, expiresAt]
  )
  return result.rows[0]
}

const deleteRefreshToken = async (token) => {
  await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token])
}

const findRefreshToken = async (token) => {
  const result = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token = $1',
    [token]
  )
  return result.rows[0]
}

const savePasswordResetToken = async (userId, token, expiresAt) => {
  await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId])
  const result = await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *',
    [userId, token, expiresAt]
  )
  return result.rows[0]
}

const findPasswordResetToken = async (token) => {
  const result = await pool.query(
    'SELECT * FROM password_reset_tokens WHERE token = $1',
    [token]
  )
  return result.rows[0]
}

const deletePasswordResetToken = async (token) => {
  await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token])
}

const saveEmailVerificationToken = async (userId, token, expiresAt) => {
  await pool.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId])
  const result = await pool.query(
    'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *',
    [userId, token, expiresAt]
  )
  return result.rows[0]
}

const findEmailVerificationToken = async (token) => {
  const result = await pool.query(
    'SELECT * FROM email_verification_tokens WHERE token = $1',
    [token]
  )
  return result.rows[0]
}

const deleteEmailVerificationToken = async (token) => {
  await pool.query('DELETE FROM email_verification_tokens WHERE token = $1', [token])
}

const markUserAsVerified = async (userId) => {
  await pool.query('UPDATE users SET is_verified = true WHERE id = $1', [userId])
}

const updateUserPassword = async (userId, hashedPassword) => {
  await pool.query(
    'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
    [hashedPassword, userId]
  )
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  saveRefreshToken,
  deleteRefreshToken,
  findRefreshToken,
  savePasswordResetToken,
  findPasswordResetToken,
  deletePasswordResetToken,
  updateUserPassword,
  saveEmailVerificationToken,
  findEmailVerificationToken,
  deleteEmailVerificationToken,
  markUserAsVerified
}
