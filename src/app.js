const express = require('express')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const authRoutes = require('./routes/authRoutes')

const app = express()

app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

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
