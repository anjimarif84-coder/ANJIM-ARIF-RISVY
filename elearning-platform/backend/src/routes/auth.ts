import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
} from '@/controllers/authController';
import { authenticate } from '@/middleware/auth';
import { validate, schemas } from '@/middleware/validation';
import Joi from 'joi';

const router = Router();

// Public routes
router.post('/register', validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);
router.post('/refresh', 
  validate(Joi.object({ refreshToken: Joi.string().required() })), 
  refreshToken
);

// Protected routes
router.use(authenticate);
router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', 
  validate(Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    profileImageUrl: Joi.string().uri().optional(),
  })), 
  updateProfile
);
router.put('/change-password',
  validate(Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
  })),
  changePassword
);

export default router;