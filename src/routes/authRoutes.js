const express = require('express')
const { body } = require('express-validator')
const { register, login, getMe, logout, refreshToken, forgotPassword, resetPassword, verifyEmail } = require('../controllers/authController')
const { authenticate } = require('../middleware/authMiddleware')

const router = express.Router()

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase and a number')
]

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
]

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
]

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase and a number')
]

router.post('/register', registerValidation, register)
router.post('/login', loginValidation, login)
router.get('/me', authenticate, getMe)
router.post('/logout', authenticate, logout)
router.post('/refresh-token', refreshToken)
router.post('/forgot-password', forgotPasswordValidation, forgotPassword)
router.post('/reset-password', resetPasswordValidation, resetPassword)
router.get('/verify-email', verifyEmail)

module.exports = router
