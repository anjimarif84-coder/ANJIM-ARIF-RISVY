import request from 'supertest'
import app from '../index'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'STUDENT',
      }

      // Mock Prisma methods
      const mockUser = {
        id: '1',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        avatar: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({})

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(userData.email)
      expect(response.body.data.tokens).toHaveProperty('accessToken')
      expect(response.body.data.tokens).toHaveProperty('refreshToken')
    })

    it('should return error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: userData.email,
      })

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('already exists')
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockUser = {
        id: '1',
        email: loginData.email,
        password: '$2a$12$hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'STUDENT',
        avatar: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({})

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(loginData.email)
      expect(response.body.data.tokens).toHaveProperty('accessToken')
      expect(response.body.data.tokens).toHaveProperty('refreshToken')
    })

    it('should return error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid credentials')
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token'

      const mockTokenRecord = {
        id: '1',
        token: refreshToken,
        userId: '1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'STUDENT',
          isActive: true,
        },
      }

      ;(prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(mockTokenRecord)
      ;(prisma.refreshToken.delete as jest.Mock).mockResolvedValue({})
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({})

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.tokens).toHaveProperty('accessToken')
      expect(response.body.data.tokens).toHaveProperty('refreshToken')
    })

    it('should return error for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })
})