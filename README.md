# Auth Microservice

A standalone authentication REST API built with Node.js, Express, and PostgreSQL. Designed as a plug-and-play microservice that can be integrated into any project requiring user authentication.

## Features

- User registration with input validation
- Login with JWT access and refresh tokens
- Protected routes via Bearer token authentication
- Refresh token rotation
- Secure logout with server-side token invalidation
- Password reset via email
- Rate limiting, security headers, and request logging

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** PostgreSQL
- **Authentication:** JSON Web Tokens (JWT)
- **Password Hashing:** bcrypt
- **Email:** Nodemailer
- **Validation:** express-validator
- **Security:** helmet, express-rate-limit

## Project Structure

```
src/
├── config/         # Database connection, environment variables, schema
├── controllers/    # Route handler logic
├── middleware/     # JWT authentication middleware
├── models/         # Database queries
├── routes/         # API route definitions
└── utils/          # Token generation, email helpers
```

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL

### Installation

1. Clone the repository

```bash
git clone https://github.com/davidtiger3622/auth-microservice.git
cd auth-microservice
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the root directory

```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth_microservice
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=your_email@gmail.com
```

4. Set up the database

```bash
psql -U postgres -d auth_microservice -f src/config/schema.sql
```

5. Start the development server

```bash
npm run dev
```

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Check if service is running | No |
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login and get tokens | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/logout` | Logout and invalidate token | Yes |
| POST | `/api/auth/refresh-token` | Get new access token | No |
| POST | `/api/auth/forgot-password` | Request password reset email | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |

## Request Examples

**Register**
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Login**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Protected Route**
```
GET /api/auth/me
Authorization: Bearer your_access_token
```

**Refresh Token**
```json
POST /api/auth/refresh-token
{
  "refreshToken": "your_refresh_token"
}
```

**Forgot Password**
```json
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}
```

**Reset Password**
```json
POST /api/auth/reset-password
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123"
}
```

## Security Highlights

- Passwords hashed with bcrypt at cost factor 12
- JWT access tokens expire in 15 minutes
- Refresh tokens stored in database and invalidated on logout
- Rate limiting: 100 requests per 15 minutes
- HTTP security headers via helmet
- Input validation and sanitization on all endpoints
- Password reset tokens are single-use and expire in 1 hour
