const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { validationResult } = require('express-validator')
const {
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
} = require('../models/userModel')
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils')
const { jwt: jwtConfig } = require('../config/env')
const { sendPasswordResetEmail, sendVerificationEmail } = require('../utils/emailUtils')

const register = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { email, password } = req.body

    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await createUser(email, hashedPassword)

    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await saveEmailVerificationToken(user.id, verificationToken, expiresAt)
    await sendVerificationEmail(email, verificationToken)

    return res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user
    })
  } catch (error) {
    console.error('Register error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

const login = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { email, password } = req.body

    const user = await findUserByEmail(email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const accessToken = generateAccessToken(user.id)
    const refreshToken = generateRefreshToken(user.id)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    await saveRefreshToken(user.id, refreshToken, expiresAt)

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email }
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

const getMe = async (req, res) => {
  try {
    const user = await findUserById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    return res.status(200).json({ user })
  } catch (error) {
    console.error('GetMe error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' })
    }

    await deleteRefreshToken(refreshToken)
    return res.status(200).json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body
    if (!token) {
      return res.status(400).json({ error: 'Refresh token required' })
    }

    const stored = await findRefreshToken(token)
    if (!stored) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    if (new Date() > new Date(stored.expires_at)) {
      await deleteRefreshToken(token)
      return res.status(401).json({ error: 'Refresh token expired' })
    }

    const decoded = jwt.verify(token, jwtConfig.refreshSecret)
    const newAccessToken = generateAccessToken(decoded.userId)

    return res.status(200).json({ accessToken: newAccessToken })
  } catch (error) {
    console.error('Refresh token error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

const forgotPassword = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { email } = req.body

    const user = await findUserByEmail(email)
    if (!user) {
      return res.status(200).json({ message: 'If that email exists, a reset link has been sent' })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    await savePasswordResetToken(user.id, resetToken, expiresAt)
    await sendPasswordResetEmail(email, resetToken)

    return res.status(200).json({ message: 'If that email exists, a reset link has been sent' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

const resetPassword = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { token, password } = req.body

    const stored = await findPasswordResetToken(token)
    if (!stored) {
      return res.status(400).json({ error: 'Invalid or expired reset token' })
    }

    if (new Date() > new Date(stored.expires_at)) {
      await deletePasswordResetToken(token)
      return res.status(400).json({ error: 'Invalid or expired reset token' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    await updateUserPassword(stored.user_id, hashedPassword)
    await deletePasswordResetToken(token)

    return res.status(200).json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = { register, login, getMe, logout, refreshToken, forgotPassword, resetPassword }
