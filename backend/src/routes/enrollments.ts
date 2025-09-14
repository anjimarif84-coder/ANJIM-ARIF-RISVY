import { Router } from 'express';
import { EnrollmentService } from '../services/enrollmentService';
import { authenticateToken, requireStudent, requireTeacher } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Enroll in course
router.post('/:courseId', authenticateToken, requireStudent, asyncHandler(async (req, res) => {
  const enrollment = await EnrollmentService.enrollInCourse(req.user!.id, req.params.courseId);
  
  res.status(201).json({
    success: true,
    data: enrollment,
    message: 'Successfully enrolled in course',
  });
}));

// Get user's enrollments
router.get('/my-enrollments', authenticateToken, requireStudent, asyncHandler(async (req, res) => {
  const enrollments = await EnrollmentService.getUserEnrollments(req.user!.id);
  
  res.json({
    success: true,
    data: enrollments,
  });
}));

// Get course enrollments (instructor only)
router.get('/course/:courseId', authenticateToken, requireTeacher, asyncHandler(async (req, res) => {
  const enrollments = await EnrollmentService.getCourseEnrollments(req.params.courseId, req.user!.id);
  
  res.json({
    success: true,
    data: enrollments,
  });
}));

// Update lesson progress
router.post('/:enrollmentId/progress/:lessonId', authenticateToken, requireStudent, asyncHandler(async (req, res) => {
  const progress = await EnrollmentService.updateProgress(req.user!.id, req.params.lessonId, req.params.enrollmentId);
  
  res.json({
    success: true,
    data: progress,
    message: 'Progress updated successfully',
  });
}));

// Get course progress
router.get('/:courseId/progress', authenticateToken, requireStudent, asyncHandler(async (req, res) => {
  const progress = await EnrollmentService.getProgress(req.user!.id, req.params.courseId);
  
  res.json({
    success: true,
    data: progress,
  });
}));

// Cancel enrollment
router.delete('/:courseId', authenticateToken, requireStudent, asyncHandler(async (req, res) => {
  await EnrollmentService.cancelEnrollment(req.user!.id, req.params.courseId);
  
  res.json({
    success: true,
    message: 'Enrollment cancelled successfully',
  });
}));

// Complete course
router.post('/:courseId/complete', authenticateToken, requireStudent, asyncHandler(async (req, res) => {
  await EnrollmentService.completeCourse(req.user!.id, req.params.courseId);
  
  res.json({
    success: true,
    message: 'Course completed successfully',
  });
}));

export { router as enrollmentRoutes };