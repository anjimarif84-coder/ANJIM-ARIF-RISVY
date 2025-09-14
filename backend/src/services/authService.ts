import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, User, UserRole } from '@prisma/client';
import { CreateUserRequest, LoginRequest, JWTPayload } from '../types';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET;
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  private static readonly JWT_EXPIRES_IN = '15m';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  static async register(data: CreateUserRequest): Promise<{ user: Omit<User, 'password'>; tokens: { accessToken: string; refreshToken: string } }> {
    const { email, password, firstName, lastName, role = UserRole.STUDENT } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw createError('User with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  static async login(data: LoginRequest): Promise<{ user: Omit<User, 'password'>; tokens: { accessToken: string; refreshToken: string } }> {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw createError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createError('Invalid credentials', 401);
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return { user: userWithoutPassword, tokens };
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!this.JWT_REFRESH_SECRET) {
      throw createError('Refresh token secret not configured', 500);
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as JWTPayload;

      // Check if refresh token exists in database
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord || !tokenRecord.user.isActive) {
        throw createError('Invalid refresh token', 401);
      }

      // Check if token is expired
      if (tokenRecord.expiresAt < new Date()) {
        // Clean up expired token
        await prisma.refreshToken.delete({
          where: { id: tokenRecord.id },
        });
        throw createError('Refresh token expired', 401);
      }

      // Generate new tokens
      const tokens = await this.generateTokens(tokenRecord.user);

      // Delete old refresh token
      await prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });

      return tokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw createError('Invalid refresh token', 401);
      }
      throw error;
    }
  }

  static async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  static async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  private static async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    if (!this.JWT_SECRET || !this.JWT_REFRESH_SECRET) {
      throw createError('JWT secrets not configured', 500);
    }

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate access token
    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });

    // Generate refresh token
    const refreshToken = jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
    });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw createError('Current password is incorrect', 400);
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Logout all sessions
    await this.logoutAll(userId);
  }
}