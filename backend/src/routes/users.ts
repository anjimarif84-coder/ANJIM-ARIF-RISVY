import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const prisma = new PrismaClient();
const router = Router();

// Get user profile
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
}));

// Update user profile
router.put('/profile', authenticateToken, validate(schemas.updateProfile), asyncHandler(async (req, res) => {
  const { firstName, lastName, avatar } = req.body;
  
  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: { firstName, lastName, avatar },
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
  
  res.json({
    success: true,
    data: { user: updatedUser },
    message: 'Profile updated successfully',
  });
}));

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where = role ? { role: role as string } : {};
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit as string),
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
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  
  res.json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
}));

// Get user by ID (admin only)
router.get('/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
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
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }
  
  res.json({
    success: true,
    data: { user },
  });
}));

// Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { firstName, lastName, role, isActive } = req.body;
  
  const updatedUser = await prisma.user.update({
    where: { id: req.params.id },
    data: { firstName, lastName, role, isActive },
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
  
  res.json({
    success: true,
    data: { user: updatedUser },
    message: 'User updated successfully',
  });
}));

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  await prisma.user.delete({
    where: { id: req.params.id },
  });
  
  res.json({
    success: true,
    message: 'User deleted successfully',
  });
}));

export { router as userRoutes };