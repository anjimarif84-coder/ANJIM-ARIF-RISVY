import { Router } from 'express';
import { QuizService } from '../services/quizService';
import { authenticateToken, requireStudent, requireTeacher } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Get quiz (with questions, but not answers if not submitted)
router.get('/:quizId', authenticateToken, requireStudent, asyncHandler(async (req, res) => {
  const quiz = await QuizService.getQuiz(req.params.quizId, req.user!.id);
  
  res.json({
    success: true,
    data: quiz,
  });
}));

// Submit quiz response
router.post('/:quizId/submit', authenticateToken, requireStudent, validate(schemas.quizResponse), asyncHandler(async (req, res) => {
  const response = await QuizService.submitQuizResponse(req.params.quizId, req.user!.id, req.body);
  
  res.json({
    success: true,
    data: response,
    message: 'Quiz submitted successfully',
  });
}));

// Get user's quiz responses
router.get('/my-responses', authenticateToken, requireStudent, asyncHandler(async (req, res) => {
  const responses = await QuizService.getUserQuizResponses(req.user!.id);
  
  res.json({
    success: true,
    data: responses,
  });
}));

// Get quiz results (instructor only)
router.get('/:quizId/results', authenticateToken, requireTeacher, asyncHandler(async (req, res) => {
  const results = await QuizService.getQuizResults(req.params.quizId, req.user!.id);
  
  res.json({
    success: true,
    data: results,
  });
}));

export { router as quizRoutes };