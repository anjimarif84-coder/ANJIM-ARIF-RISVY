import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

const courseSchema = z.object({ title: z.string().min(1), description: z.string().min(1) });
const lessonSchema = z.object({ title: z.string().min(1), videoKey: z.string().min(1), order: z.number().int().min(0) });

export function coursesRouter(prisma: PrismaClient) {
  const router = Router();

  router.get('/', async (_req, res) => {
    const courses = await prisma.course.findMany({ include: { teacher: true, lessons: true } });
    res.json(courses);
  });

  router.get('/:id', async (req, res) => {
    const course = await prisma.course.findUnique({ where: { id: req.params.id }, include: { teacher: true, lessons: true } });
    if (!course) return res.status(404).json({ message: 'Not found' });
    res.json(course);
  });

  router.post('/', requireAuth(['TEACHER', 'ADMIN']), async (req: any, res) => {
    const parsed = courseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const course = await prisma.course.create({ data: { ...parsed.data, teacherId: req.user.id } });
    res.status(201).json(course);
  });

  router.put('/:id', requireAuth(['TEACHER', 'ADMIN']), async (req: any, res) => {
    const parsed = courseSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const existing = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'ADMIN' && existing.teacherId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    const updated = await prisma.course.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(updated);
  });

  router.delete('/:id', requireAuth(['TEACHER', 'ADMIN']), async (req: any, res) => {
    const existing = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'ADMIN' && existing.teacherId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await prisma.course.delete({ where: { id: req.params.id } });
    res.status(204).send();
  });

  router.post('/:id/lessons', requireAuth(['TEACHER', 'ADMIN']), async (req: any, res) => {
    const parsed = lessonSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const course = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.user.role !== 'ADMIN' && course.teacherId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    const lesson = await prisma.lesson.create({ data: { ...parsed.data, courseId: req.params.id } });
    res.status(201).json(lesson);
  });

  // Enrollment
  router.post('/:id/enroll', requireAuth(['STUDENT', 'TEACHER', 'ADMIN']), async (req: any, res) => {
    try {
      const enrollment = await prisma.enrollment.create({ data: { courseId: req.params.id, userId: req.user.id } });
      res.status(201).json(enrollment);
    } catch (e) {
      return res.status(409).json({ message: 'Already enrolled' });
    }
  });

  return router;
}

