const request = require('supertest')
const app = require('../src/app')
const pool = require('../src/config/db')
const { clearDatabase } = require('./setup')

jest.mock('../src/utils/emailUtils', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true)
}))

const { sendVerificationEmail, sendPasswordResetEmail } = require('../src/utils/emailUtils')

beforeEach(async () => {
  await clearDatabase()
})

afterAll(async () => {
  await pool.end()
})

describe('GET /health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})

describe('POST /api/auth/register', () => {
  it('registers a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'newuser@example.com', password: 'SecurePass123' })

    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('newuser@example.com')
    expect(res.body.user.password).toBeUndefined()
  })

  it('rejects duplicate email registration', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dupe@example.com', password: 'SecurePass123' })

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dupe@example.com', password: 'SecurePass123' })

    expect(res.status).toBe(409)
  })

  it('rejects weak passwords', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'weakpass@example.com', password: 'weak' })

    expect(res.status).toBe(400)
  })

  it('rejects invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'SecurePass123' })

    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'loginuser@example.com', password: 'SecurePass123' })
    })
  
    it('logs in successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'loginuser@example.com', password: 'SecurePass123' })
  
      expect(res.status).toBe(200)
      expect(res.body.accessToken).toBeDefined()
      expect(res.body.refreshToken).toBeDefined()
      expect(res.body.user.email).toBe('loginuser@example.com')
    })
  
    it('rejects login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'loginuser@example.com', password: 'WrongPass123' })
  
      expect(res.status).toBe(401)
    })
  
    it('rejects login with unregistered email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nouser@example.com', password: 'SecurePass123' })
  
      expect(res.status).toBe(401)
    })
  
    it('rejects login with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'loginuser@example.com' })
  
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/auth/me', () => {
    let accessToken
  
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'meuser@example.com', password: 'SecurePass123' })
  
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'meuser@example.com', password: 'SecurePass123' })
  
      accessToken = loginRes.body.accessToken
    })
  
    it('returns the current user with a valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
  
      expect(res.status).toBe(200)
      expect(res.body.user.email).toBe('meuser@example.com')
    })
  
    it('rejects request with no authorization header', async () => {
      const res = await request(app).get('/api/auth/me')
  
      expect(res.status).toBe(401)
    })
  
    it('rejects request with malformed authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', accessToken)
  
      expect(res.status).toBe(401)
    })
  
    it('rejects request with an invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not.a.real.token')
  
      expect(res.status).toBe(401)
    })
  
    it('rejects request with an expired token', async () => {
      const jwt = require('jsonwebtoken')
      const { jwt: jwtConfig } = require('../src/config/env')
      const expiredToken = jwt.sign({ userId: 1 }, jwtConfig.accessSecret, { expiresIn: '-10s' })
  
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
  
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'forgotuser@example.com', password: 'SecurePass123' })
    })
  
    it('sends a reset email for an existing user', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'forgotuser@example.com' })
  
      expect(res.status).toBe(200)
      expect(sendPasswordResetEmail).toHaveBeenCalled()
    })
  
    it('returns 200 without revealing whether the email exists', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nouser@example.com' })
  
      expect(res.status).toBe(200)
    })
  
    it('rejects invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' })
  
      expect(res.status).toBe(400)
    })
  })
  
  describe('POST /api/auth/reset-password', () => {
    let resetToken
  
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'resetuser@example.com', password: 'SecurePass123' })
  
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'resetuser@example.com' })
  
      const lastCall = sendPasswordResetEmail.mock.calls[sendPasswordResetEmail.mock.calls.length - 1]
      resetToken = lastCall[1]
    })
  
    it('resets the password with a valid token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: resetToken, password: 'NewSecurePass123' })
  
      expect(res.status).toBe(200)
  
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'resetuser@example.com', password: 'NewSecurePass123' })
  
      expect(loginRes.status).toBe(200)
    })
  
    it('rejects an invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'not-a-real-token', password: 'NewSecurePass123' })
  
      expect(res.status).toBe(400)
    })
  
    it('rejects a weak new password', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: resetToken, password: 'weak' })
  
      expect(res.status).toBe(400)
    })
  })
  
  describe('GET /api/auth/verify-email', () => {
    let verificationToken
  
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'verifyuser@example.com', password: 'SecurePass123' })
  
      const lastCall = sendVerificationEmail.mock.calls[sendVerificationEmail.mock.calls.length - 1]
      verificationToken = lastCall[1]
    })
  
    it('verifies the email with a valid token', async () => {
      const res = await request(app)
        .get('/api/auth/verify-email')
        .query({ token: verificationToken })
  
      expect(res.status).toBe(200)
    })
  
    it('rejects a missing token', async () => {
      const res = await request(app).get('/api/auth/verify-email')
  
      expect(res.status).toBe(400)
    })
  
    it('rejects an invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/verify-email')
        .query({ token: 'not-a-real-token' })
  
      expect(res.status).toBe(400)
    })
  })
  
  describe('POST /api/auth/refresh-token', () => {
    let refreshToken
  
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'refreshuser@example.com', password: 'SecurePass123' })
  
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'refreshuser@example.com', password: 'SecurePass123' })
  
      refreshToken = loginRes.body.refreshToken
    })
  
    it('issues new tokens with a valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
  
      expect(res.status).toBe(200)
      expect(res.body.accessToken).toBeDefined()
      expect(res.body.refreshToken).toBeDefined()
    })
  
    it('rejects a missing refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({})
  
      expect(res.status).toBe(400)
    })
  
    it('rejects reuse of an already-rotated refresh token', async () => {
      await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
  
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
  
      expect(res.status).toBe(401)
    })
  })
  
  describe('POST /api/auth/logout', () => {
    let accessToken
    let refreshToken
  
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'logoutuser@example.com', password: 'SecurePass123' })
  
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'logoutuser@example.com', password: 'SecurePass123' })
  
      accessToken = loginRes.body.accessToken
      refreshToken = loginRes.body.refreshToken
    })
  
    it('logs out successfully and invalidates the refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
  
      expect(res.status).toBe(200)
  
      const refreshRes = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
  
      expect(refreshRes.status).toBe(401)
    })
  
    it('rejects logout with no refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
  
      expect(res.status).toBe(400)
    })
  })
