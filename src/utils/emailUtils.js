const nodemailer = require('nodemailer')
const { email: emailConfig } = require('../config/env')

const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: false,
  auth: {
    user: emailConfig.user,
    pass: emailConfig.pass,
  }
})

const sendPasswordResetEmail = async (toEmail, resetToken) => {
  const resetUrl = `http://localhost:5000/api/auth/reset-password?token=${resetToken}`

  await transporter.sendMail({
    from: emailConfig.from,
    to: toEmail,
    subject: 'Password Reset Request',
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset. Click the link below to reset your password.</p>
      <p>This link expires in 1 hour.</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>If you did not request this, ignore this email.</p>
    `
  })
}

module.exports = { sendPasswordResetEmail }
