import { Router } from 'express';
import { AuthService } from '../services/authService';
import { authenticateToken } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Register
router.post('/register', validate(schemas.register), asyncHandler(async (req, res) => {
  const { user, tokens } = await AuthService.register(req.body);
  
  res.status(201).json({
    success: true,
    data: { user, tokens },
    message: 'User registered successfully',
  });
}));

// Login
router.post('/login', validate(schemas.login), asyncHandler(async (req, res) => {
  const { user, tokens } = await AuthService.login(req.body);
  
  res.json({
    success: true,
    data: { user, tokens },
    message: 'Login successful',
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Refresh token required',
    });
  }

  const tokens = await AuthService.refreshToken(refreshToken);
  
  res.json({
    success: true,
    data: { tokens },
    message: 'Token refreshed successfully',
  });
}));

// Logout
router.post('/logout', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (refreshToken) {
    await AuthService.logout(refreshToken);
  }
  
  res.json({
    success: true,
    message: 'Logout successful',
  });
}));

// Logout all sessions
router.post('/logout-all', authenticateToken, asyncHandler(async (req, res) => {
  await AuthService.logoutAll(req.user!.id);
  
  res.json({
    success: true,
    message: 'All sessions logged out successfully',
  });
}));

// Change password
router.post('/change-password', authenticateToken, validate(schemas.changePassword), asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  await AuthService.changePassword(req.user!.id, currentPassword, newPassword);
  
  res.json({
    success: true,
    message: 'Password changed successfully',
  });
}));

// Get current user
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
}));

export { router as authRoutes };