import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

const quizSchema = z.object({ title: z.string(), questions: z.array(z.any()) });
const responseSchema = z.object({ answers: z.array(z.any()) });

export function quizzesRouter(prisma: PrismaClient) {
  const router = Router();

  router.post('/lessons/:lessonId', requireAuth(['TEACHER', 'ADMIN']), async (req, res) => {
    const parsed = quizSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId } });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    const quiz = await prisma.quiz.create({ data: { ...parsed.data, lessonId: lesson.id } });
    res.status(201).json(quiz);
  });

  router.post('/:quizId/submit', requireAuth(['STUDENT', 'TEACHER', 'ADMIN']), async (req: any, res) => {
    const parsed = responseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const quiz = await prisma.quiz.findUnique({ where: { id: req.params.quizId } });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    // Placeholder scoring: 0
    const score = 0;
    const response = await prisma.quizResponse.create({ data: { quizId: quiz.id, userId: (req as any).user.id, answers: parsed.data.answers, score } });
    res.status(201).json(response);
  });

  return router;
}

