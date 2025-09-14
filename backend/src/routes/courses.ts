import { Router } from 'express';
import { CourseService } from '../services/courseService';
import { authenticateToken, requireTeacher, requireAdmin } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Get all published courses (public)
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder } = req.query;
  const { courses, total } = await CourseService.getCourses({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  });

  res.json({
    success: true,
    data: courses,
    pagination: {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      total,
      totalPages: Math.ceil(total / (limit ? parseInt(limit as string) : 10)),
    },
  });
}));

// Get course by ID (public, but shows enrollment status if authenticated)
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const course = await CourseService.getCourseById(req.params.id, req.user!.id);
  
  res.json({
    success: true,
    data: course,
  });
}));

// Create course (teacher/admin only)
router.post('/', authenticateToken, requireTeacher, validate(schemas.createCourse), asyncHandler(async (req, res) => {
  const course = await CourseService.createCourse(req.body, req.user!.id);
  
  res.status(201).json({
    success: true,
    data: course,
    message: 'Course created successfully',
  });
}));

// Update course (instructor/admin only)
router.put('/:id', authenticateToken, requireTeacher, validate(schemas.updateCourse), asyncHandler(async (req, res) => {
  const course = await CourseService.updateCourse(req.params.id, req.body, req.user!.id, req.user!.role);
  
  res.json({
    success: true,
    data: course,
    message: 'Course updated successfully',
  });
}));

// Delete course (instructor/admin only)
router.delete('/:id', authenticateToken, requireTeacher, asyncHandler(async (req, res) => {
  await CourseService.deleteCourse(req.params.id, req.user!.id, req.user!.role);
  
  res.json({
    success: true,
    message: 'Course deleted successfully',
  });
}));

// Get instructor's courses
router.get('/instructor/my-courses', authenticateToken, requireTeacher, asyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder } = req.query;
  const { courses, total } = await CourseService.getInstructorCourses(req.user!.id, {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  });

  res.json({
    success: true,
    data: courses,
    pagination: {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      total,
      totalPages: Math.ceil(total / (limit ? parseInt(limit as string) : 10)),
    },
  });
}));

// Create lesson (instructor/admin only)
router.post('/:courseId/lessons', authenticateToken, requireTeacher, validate(schemas.createLesson), asyncHandler(async (req, res) => {
  const lesson = await CourseService.createLesson(req.params.courseId, req.body, req.user!.id, req.user!.role);
  
  res.status(201).json({
    success: true,
    data: lesson,
    message: 'Lesson created successfully',
  });
}));

// Update lesson (instructor/admin only)
router.put('/lessons/:lessonId', authenticateToken, requireTeacher, validate(schemas.createLesson), asyncHandler(async (req, res) => {
  const lesson = await CourseService.updateLesson(req.params.lessonId, req.body, req.user!.id, req.user!.role);
  
  res.json({
    success: true,
    data: lesson,
    message: 'Lesson updated successfully',
  });
}));

// Delete lesson (instructor/admin only)
router.delete('/lessons/:lessonId', authenticateToken, requireTeacher, asyncHandler(async (req, res) => {
  await CourseService.deleteLesson(req.params.lessonId, req.user!.id, req.user!.role);
  
  res.json({
    success: true,
    message: 'Lesson deleted successfully',
  });
}));

// Create quiz (instructor/admin only)
router.post('/:courseId/quizzes', authenticateToken, requireTeacher, validate(schemas.createQuiz), asyncHandler(async (req, res) => {
  const quiz = await CourseService.createQuiz(req.params.courseId, req.body, req.user!.id, req.user!.role);
  
  res.status(201).json({
    success: true,
    data: quiz,
    message: 'Quiz created successfully',
  });
}));

export { router as courseRoutes };