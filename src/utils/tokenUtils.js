const jwt = require('jsonwebtoken')
const { jwt: jwtConfig } = require('../config/env')

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiresIn
  })
}

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn
  })
}

module.exports = { generateAccessToken, generateRefreshToken }
