import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { getCloudFrontSignedUrlForKey } from '../services/s3';

export function videosRouter(prisma: PrismaClient) {
  const router = Router();

  router.get('/:lessonId/signed-url', requireAuth(['STUDENT', 'TEACHER', 'ADMIN']), async (req: any, res) => {
    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId } });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    // Ensure enrollment
    const enrollment = await prisma.enrollment.findFirst({ where: { courseId: lesson.courseId, userId: req.user.id } });
    if (!enrollment && req.user.role === 'STUDENT') return res.status(403).json({ message: 'Not enrolled' });
    const url = getCloudFrontSignedUrlForKey(lesson.videoKey, 3600);
    res.json({ url });
  });

  return router;
}

