import request from 'supertest';
import app from '../../index';
import { createTestUser, expectErrorResponse, expectSuccessResponse } from '../helpers/testHelpers';

describe('Auth Controller', () => {
  const testUserData = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUserData);

      expectSuccessResponse(response, 201);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testUserData.email);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return error for duplicate email', async () => {
      // Create user first
      await createTestUser(global.__PRISMA__, { email: testUserData.email });

      const response = await request(app)
        .post('/api/auth/register')
        .send(testUserData);

      expectErrorResponse(response, 409, 'already exists');
    });

    it('should return validation error for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUserData,
          email: 'invalid-email',
        });

      expectErrorResponse(response, 400, 'Validation error');
    });

    it('should return validation error for short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUserData,
          password: '123',
        });

      expectErrorResponse(response, 400, 'Validation error');
    });
  });

  describe('POST /api/auth/login', () => {
    let user: any;

    beforeEach(async () => {
      user = await createTestUser(global.__PRISMA__, {
        email: testUserData.email,
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserData.email,
          password: 'password123', // Default password from createTestUser
        });

      expectSuccessResponse(response, 200);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testUserData.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return error for incorrect email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123',
        });

      expectErrorResponse(response, 401, 'Invalid credentials');
    });

    it('should return error for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserData.email,
          password: 'wrongpassword',
        });

      expectErrorResponse(response, 401, 'Invalid credentials');
    });

    it('should return validation error for missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserData.email,
          // missing password
        });

      expectErrorResponse(response, 400, 'Validation error');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const user = await createTestUser(global.__PRISMA__);
      
      // Login to get refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'password123',
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh tokens successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expectSuccessResponse(response, 200);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.refreshToken).not.toBe(refreshToken); // Should be new token
    });

    it('should return error for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expectErrorResponse(response, 401, 'Invalid refresh token');
    });

    it('should return error for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expectErrorResponse(response, 400, 'Refresh token required');
    });
  });

  describe('GET /api/auth/profile', () => {
    let user: any;
    let authHeader: string;

    beforeEach(async () => {
      user = await createTestUser(global.__PRISMA__);
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'password123',
        });

      authHeader = `Bearer ${loginResponse.body.data.accessToken}`;
    });

    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', authHeader);

      expectSuccessResponse(response, 200);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.email).toBe(user.email);
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return error for missing auth token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expectErrorResponse(response, 401, 'No token provided');
    });

    it('should return error for invalid auth token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expectErrorResponse(response, 401, 'Invalid token');
    });
  });

  describe('POST /api/auth/logout', () => {
    let refreshToken: string;
    let authHeader: string;

    beforeEach(async () => {
      const user = await createTestUser(global.__PRISMA__);
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'password123',
        });

      refreshToken = loginResponse.body.data.refreshToken;
      authHeader = `Bearer ${loginResponse.body.data.accessToken}`;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', authHeader)
        .send({ refreshToken });

      expectSuccessResponse(response, 200);
      expect(response.body.message).toContain('Logged out successfully');
    });

    it('should still work without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', authHeader)
        .send({});

      expectSuccessResponse(response, 200);
    });
  });
});