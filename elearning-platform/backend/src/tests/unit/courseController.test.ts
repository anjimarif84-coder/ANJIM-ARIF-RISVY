import request from 'supertest';
import app from '../../index';
import {
  createTestUser,
  createTestCourse,
  createAuthenticatedRequest,
  expectErrorResponse,
  expectSuccessResponse,
} from '../helpers/testHelpers';

describe('Course Controller', () => {
  let student: any;
  let teacher: any;
  let admin: any;
  let studentAuth: string;
  let teacherAuth: string;
  let adminAuth: string;

  beforeEach(async () => {
    // Create test users
    student = await createTestUser(global.__PRISMA__, { role: 'STUDENT' });
    teacher = await createTestUser(global.__PRISMA__, { role: 'TEACHER' });
    admin = await createTestUser(global.__PRISMA__, { role: 'ADMIN' });

    // Get auth tokens
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: 'password123' });
    studentAuth = `Bearer ${studentLogin.body.data.accessToken}`;

    const teacherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: teacher.email, password: 'password123' });
    teacherAuth = `Bearer ${teacherLogin.body.data.accessToken}`;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'password123' });
    adminAuth = `Bearer ${adminLogin.body.data.accessToken}`;
  });

  describe('GET /api/courses', () => {
    beforeEach(async () => {
      // Create test courses
      await createTestCourse(global.__PRISMA__, teacher.id, {
        title: 'Published Course',
        isPublished: true,
      });
      await createTestCourse(global.__PRISMA__, teacher.id, {
        title: 'Draft Course',
        isPublished: false,
      });
    });

    it('should get published courses for unauthenticated users', async () => {
      const response = await request(app).get('/api/courses');

      expectSuccessResponse(response, 200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Published Course');
      expect(response.body.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/courses')
        .query({ page: 1, limit: 1 });

      expectSuccessResponse(response, 200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/courses')
        .query({ search: 'Published' });

      expectSuccessResponse(response, 200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toContain('Published');
    });
  });

  describe('GET /api/courses/:id', () => {
    let course: any;

    beforeEach(async () => {
      course = await createTestCourse(global.__PRISMA__, teacher.id, {
        isPublished: true,
      });
    });

    it('should get course details for unauthenticated users', async () => {
      const response = await request(app).get(`/api/courses/${course.id}`);

      expectSuccessResponse(response, 200);
      expect(response.body.data.id).toBe(course.id);
      expect(response.body.data.title).toBe(course.title);
      expect(response.body.data.isEnrolled).toBe(false);
    });

    it('should show enrollment status for authenticated users', async () => {
      // Enroll student in course
      await global.__PRISMA__.enrollment.create({
        data: { userId: student.id, courseId: course.id },
      });

      const response = await request(app)
        .get(`/api/courses/${course.id}`)
        .set('Authorization', studentAuth);

      expectSuccessResponse(response, 200);
      expect(response.body.data.isEnrolled).toBe(true);
    });

    it('should return 404 for non-existent course', async () => {
      const response = await request(app).get('/api/courses/non-existent-id');

      expectErrorResponse(response, 404, 'not found');
    });
  });

  describe('POST /api/courses', () => {
    const courseData = {
      title: 'New Course',
      description: 'A new course description',
      shortDescription: 'New course',
      price: 99.99,
    };

    it('should create course as teacher', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', teacherAuth)
        .send(courseData);

      expectSuccessResponse(response, 201);
      expect(response.body.data.title).toBe(courseData.title);
      expect(response.body.data.teacherId).toBe(teacher.id);
    });

    it('should create course as admin', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', adminAuth)
        .send(courseData);

      expectSuccessResponse(response, 201);
    });

    it('should not allow students to create courses', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', studentAuth)
        .send(courseData);

      expectErrorResponse(response, 403, 'Insufficient permissions');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/courses')
        .send(courseData);

      expectErrorResponse(response, 401, 'No token provided');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', teacherAuth)
        .send({ title: 'Only Title' }); // Missing required fields

      expectErrorResponse(response, 400, 'Validation error');
    });
  });

  describe('PUT /api/courses/:id', () => {
    let course: any;

    beforeEach(async () => {
      course = await createTestCourse(global.__PRISMA__, teacher.id);
    });

    it('should update own course as teacher', async () => {
      const updateData = { title: 'Updated Course Title' };

      const response = await request(app)
        .put(`/api/courses/${course.id}`)
        .set('Authorization', teacherAuth)
        .send(updateData);

      expectSuccessResponse(response, 200);
      expect(response.body.data.title).toBe(updateData.title);
    });

    it('should update any course as admin', async () => {
      const updateData = { title: 'Updated by Admin' };

      const response = await request(app)
        .put(`/api/courses/${course.id}`)
        .set('Authorization', adminAuth)
        .send(updateData);

      expectSuccessResponse(response, 200);
      expect(response.body.data.title).toBe(updateData.title);
    });

    it('should not allow updating other teacher\'s course', async () => {
      const otherTeacher = await createTestUser(global.__PRISMA__, { role: 'TEACHER' });
      const otherTeacherLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: otherTeacher.email, password: 'password123' });
      const otherTeacherAuth = `Bearer ${otherTeacherLogin.body.data.accessToken}`;

      const response = await request(app)
        .put(`/api/courses/${course.id}`)
        .set('Authorization', otherTeacherAuth)
        .send({ title: 'Unauthorized Update' });

      expectErrorResponse(response, 403, 'Not authorized');
    });

    it('should not allow students to update courses', async () => {
      const response = await request(app)
        .put(`/api/courses/${course.id}`)
        .set('Authorization', studentAuth)
        .send({ title: 'Student Update' });

      expectErrorResponse(response, 403, 'Insufficient permissions');
    });
  });

  describe('DELETE /api/courses/:id', () => {
    let course: any;

    beforeEach(async () => {
      course = await createTestCourse(global.__PRISMA__, teacher.id);
    });

    it('should delete own course as teacher', async () => {
      const response = await request(app)
        .delete(`/api/courses/${course.id}`)
        .set('Authorization', teacherAuth);

      expectSuccessResponse(response, 200);
      expect(response.body.message).toContain('deleted successfully');

      // Verify course is deleted
      const checkResponse = await request(app).get(`/api/courses/${course.id}`);
      expectErrorResponse(checkResponse, 404);
    });

    it('should delete any course as admin', async () => {
      const response = await request(app)
        .delete(`/api/courses/${course.id}`)
        .set('Authorization', adminAuth);

      expectSuccessResponse(response, 200);
    });

    it('should not allow deleting other teacher\'s course', async () => {
      const otherTeacher = await createTestUser(global.__PRISMA__, { role: 'TEACHER' });
      const otherTeacherLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: otherTeacher.email, password: 'password123' });
      const otherTeacherAuth = `Bearer ${otherTeacherLogin.body.data.accessToken}`;

      const response = await request(app)
        .delete(`/api/courses/${course.id}`)
        .set('Authorization', otherTeacherAuth);

      expectErrorResponse(response, 403, 'Not authorized');
    });
  });

  describe('GET /api/courses/my/courses', () => {
    beforeEach(async () => {
      await createTestCourse(global.__PRISMA__, teacher.id, { title: 'My Course 1' });
      await createTestCourse(global.__PRISMA__, teacher.id, { title: 'My Course 2' });
      // Create course by another teacher
      const otherTeacher = await createTestUser(global.__PRISMA__, { role: 'TEACHER' });
      await createTestCourse(global.__PRISMA__, otherTeacher.id, { title: 'Other Course' });
    });

    it('should get teacher\'s own courses', async () => {
      const response = await request(app)
        .get('/api/courses/my/courses')
        .set('Authorization', teacherAuth);

      expectSuccessResponse(response, 200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((course: any) => course.teacherId === teacher.id)).toBe(true);
    });

    it('should not allow students to access this endpoint', async () => {
      const response = await request(app)
        .get('/api/courses/my/courses')
        .set('Authorization', studentAuth);

      expectErrorResponse(response, 403, 'Insufficient permissions');
    });
  });

  describe('PATCH /api/courses/:id/publish', () => {
    let course: any;

    beforeEach(async () => {
      course = await createTestCourse(global.__PRISMA__, teacher.id, {
        isPublished: false,
      });
      // Add a lesson to make course publishable
      await global.__PRISMA__.lesson.create({
        data: {
          title: 'Test Lesson',
          order: 1,
          courseId: course.id,
        },
      });
    });

    it('should publish course with lessons', async () => {
      const response = await request(app)
        .patch(`/api/courses/${course.id}/publish`)
        .set('Authorization', teacherAuth);

      expectSuccessResponse(response, 200);
      expect(response.body.data.isPublished).toBe(true);
    });

    it('should not publish course without lessons', async () => {
      // Create course without lessons
      const emptyCourse = await createTestCourse(global.__PRISMA__, teacher.id, {
        isPublished: false,
      });

      const response = await request(app)
        .patch(`/api/courses/${emptyCourse.id}/publish`)
        .set('Authorization', teacherAuth);

      expectErrorResponse(response, 400, 'at least one lesson');
    });
  });
});