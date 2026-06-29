const express = require('express')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const path = require('path')
const authRoutes = require('./routes/authRoutes')

const app = express()

app.use(helmet({ contentSecurityPolicy: false }))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' }
})
app.use(limiter)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Auth service is running' })
})

app.use('/api/auth', authRoutes)
module.exports = app
