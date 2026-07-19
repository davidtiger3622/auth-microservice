const request = require('supertest')
const app = require('../src/app')
const pool = require('../src/config/db')
const { clearDatabase } = require('./setup')

jest.mock('../src/utils/emailUtils', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true)
}))

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
