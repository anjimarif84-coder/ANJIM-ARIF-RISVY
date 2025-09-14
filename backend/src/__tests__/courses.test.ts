import request from 'supertest';
import app from '../index';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Courses', () => {
  let teacherToken: string;
  let studentToken: string;
  let teacherId: string;
  let studentId: string;

  beforeEach(async () => {
    // Create teacher user
    const hashedPassword = await bcrypt.hash('password123', 12);
    const teacher = await prisma.user.create({
      data: {
        email: 'teacher@example.com',
        password: hashedPassword,
        firstName: 'Teacher',
        lastName: 'User',
        role: UserRole.TEACHER,
      },
    });
    teacherId = teacher.id;

    // Create student user
    const student = await prisma.user.create({
      data: {
        email: 'student@example.com',
        password: hashedPassword,
        firstName: 'Student',
        lastName: 'User',
        role: UserRole.STUDENT,
      },
    });
    studentId = student.id;

    // Generate tokens
    const jwt = require('jsonwebtoken');
    teacherToken = jwt.sign(
      { userId: teacher.id, email: teacher.email, role: teacher.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '15m' }
    );

    studentToken = jwt.sign(
      { userId: student.id, email: student.email, role: student.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '15m' }
    );
  });

  describe('GET /api/courses', () => {
    beforeEach(async () => {
      // Create test courses
      await prisma.course.createMany({
        data: [
          {
            title: 'Course 1',
            description: 'Description 1',
            price: 99.99,
            instructorId: teacherId,
            status: 'PUBLISHED',
          },
          {
            title: 'Course 2',
            description: 'Description 2',
            price: 149.99,
            instructorId: teacherId,
            status: 'PUBLISHED',
          },
        ],
      });
    });

    it('should get all published courses', async () => {
      const response = await request(app)
        .get('/api/courses')
        .expect(200);

      expect(response.body.courses).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should search courses', async () => {
      const response = await request(app)
        .get('/api/courses?search=Course 1')
        .expect(200);

      expect(response.body.courses).toHaveLength(1);
      expect(response.body.courses[0].title).toBe('Course 1');
    });

    it('should paginate courses', async () => {
      const response = await request(app)
        .get('/api/courses?page=1&limit=1')
        .expect(200);

      expect(response.body.courses).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/courses/:id', () => {
    let courseId: string;

    beforeEach(async () => {
      const course = await prisma.course.create({
        data: {
          title: 'Test Course',
          description: 'Test Description',
          price: 99.99,
          instructorId: teacherId,
          status: 'PUBLISHED',
        },
      });
      courseId = course.id;
    });

    it('should get course by id', async () => {
      const response = await request(app)
        .get(`/api/courses/${courseId}`)
        .expect(200);

      expect(response.body.title).toBe('Test Course');
      expect(response.body.description).toBe('Test Description');
      expect(response.body.instructor).toBeDefined();
    });

    it('should return 404 for non-existent course', async () => {
      await request(app)
        .get('/api/courses/non-existent-id')
        .expect(404);
    });
  });

  describe('POST /api/courses', () => {
    it('should create a new course as teacher', async () => {
      const courseData = {
        title: 'New Course',
        description: 'New Description',
        price: 199.99,
      };

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(courseData)
        .expect(201);

      expect(response.body.title).toBe(courseData.title);
      expect(response.body.description).toBe(courseData.description);
      expect(response.body.price).toBe(courseData.price);
      expect(response.body.instructorId).toBe(teacherId);
    });

    it('should not create course as student', async () => {
      const courseData = {
        title: 'New Course',
        description: 'New Description',
        price: 199.99,
      };

      await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(courseData)
        .expect(403);
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/courses/:id/lessons', () => {
    let courseId: string;

    beforeEach(async () => {
      const course = await prisma.course.create({
        data: {
          title: 'Test Course',
          description: 'Test Description',
          price: 99.99,
          instructorId: teacherId,
          status: 'PUBLISHED',
        },
      });
      courseId = course.id;
    });

    it('should add lesson to course', async () => {
      const lessonData = {
        title: 'New Lesson',
        description: 'Lesson Description',
        order: 1,
        type: 'VIDEO',
        duration: 30,
      };

      const response = await request(app)
        .post(`/api/courses/${courseId}/lessons`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(lessonData)
        .expect(201);

      expect(response.body.title).toBe(lessonData.title);
      expect(response.body.courseId).toBe(courseId);
    });

    it('should not add lesson as student', async () => {
      const lessonData = {
        title: 'New Lesson',
        description: 'Lesson Description',
        order: 1,
        type: 'VIDEO',
      };

      await request(app)
        .post(`/api/courses/${courseId}/lessons`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(lessonData)
        .expect(403);
    });
  });
});