import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { s3Service } from '@/services/s3Service';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/types';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Generate signed URL for video upload
router.post('/video-upload-url', 
  authorize('TEACHER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { courseId, lessonId, filename, contentType } = req.body;

    if (!courseId || !lessonId || !filename || !contentType) {
      throw new AppError('Missing required fields', 400);
    }

    const key = s3Service.generateVideoKey(courseId, lessonId, filename);
    const signedUrlResponse = await s3Service.generateSignedUploadUrl(key, contentType);

    res.json({
      success: true,
      data: signedUrlResponse,
    });
  })
);

// Generate signed URL for course thumbnail upload
router.post('/thumbnail-upload-url',
  authorize('TEACHER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { courseId, filename, contentType } = req.body;

    if (!courseId || !filename || !contentType) {
      throw new AppError('Missing required fields', 400);
    }

    const key = s3Service.generateThumbnailKey(courseId, filename);
    const signedUrlResponse = await s3Service.generateSignedUploadUrl(key, contentType);

    res.json({
      success: true,
      data: signedUrlResponse,
    });
  })
);

// Generate signed URL for profile image upload
router.post('/profile-image-upload-url',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      throw new AppError('Missing required fields', 400);
    }

    const key = s3Service.generateProfileImageKey(req.user.id, filename);
    const signedUrlResponse = await s3Service.generateSignedUploadUrl(key, contentType);

    res.json({
      success: true,
      data: signedUrlResponse,
    });
  })
);

export default router;