import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const prisma = new PrismaClient();
const router = Router();

// Get user notifications
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where = {
    userId: req.user!.id,
    ...(unreadOnly === 'true' && { read: false }),
  };
  
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
  ]);
  
  res.json({
    success: true,
    data: notifications,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
}));

// Mark notification as read
router.put('/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  const notification = await prisma.notification.updateMany({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
    data: { read: true },
  });
  
  if (notification.count === 0) {
    return res.status(404).json({
      success: false,
      error: 'Notification not found',
    });
  }
  
  res.json({
    success: true,
    message: 'Notification marked as read',
  });
}));

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: {
      userId: req.user!.id,
      read: false,
    },
    data: { read: true },
  });
  
  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
}));

// Delete notification
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const notification = await prisma.notification.deleteMany({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
  });
  
  if (notification.count === 0) {
    return res.status(404).json({
      success: false,
      error: 'Notification not found',
    });
  }
  
  res.json({
    success: true,
    message: 'Notification deleted successfully',
  });
}));

// Get unread count
router.get('/unread-count', authenticateToken, asyncHandler(async (req, res) => {
  const count = await prisma.notification.count({
    where: {
      userId: req.user!.id,
      read: false,
    },
  });
  
  res.json({
    success: true,
    data: { count },
  });
}));

export { router as notificationRoutes };