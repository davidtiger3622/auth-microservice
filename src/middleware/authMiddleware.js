const jwt = require('jsonwebtoken')
const { jwt: jwtConfig } = require('../config/env')

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, jwtConfig.accessSecret)
    req.userId = decoded.userId
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired' })
    }
    return res.status(401).json({ error: 'Invalid access token' })
  }
}

module.exports = { authenticate }
