import { PrismaClient, UserRole, CourseStatus, LessonType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@elearning.com' },
    update: {},
    create: {
      email: 'admin@elearning.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  });

  // Create teacher user
  const teacherPassword = await bcrypt.hash('teacher123', 12);
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@elearning.com' },
    update: {},
    create: {
      email: 'teacher@elearning.com',
      password: teacherPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.TEACHER,
    },
  });

  // Create student user
  const studentPassword = await bcrypt.hash('student123', 12);
  const student = await prisma.user.upsert({
    where: { email: 'student@elearning.com' },
    update: {},
    create: {
      email: 'student@elearning.com',
      password: studentPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.STUDENT,
    },
  });

  // Create sample course
  const course = await prisma.course.upsert({
    where: { id: 'sample-course-1' },
    update: {},
    create: {
      id: 'sample-course-1',
      title: 'Complete Web Development Bootcamp',
      description: 'Learn full-stack web development with React, Node.js, and PostgreSQL',
      price: 199.99,
      status: CourseStatus.PUBLISHED,
      instructorId: teacher.id,
    },
  });

  // Create sample lessons
  const lesson1 = await prisma.lesson.upsert({
    where: { id: 'lesson-1' },
    update: {},
    create: {
      id: 'lesson-1',
      title: 'Introduction to Web Development',
      description: 'Overview of web development technologies and tools',
      content: 'Welcome to the Complete Web Development Bootcamp!',
      duration: 30,
      order: 1,
      type: LessonType.VIDEO,
      courseId: course.id,
    },
  });

  const lesson2 = await prisma.lesson.upsert({
    where: { id: 'lesson-2' },
    update: {},
    create: {
      id: 'lesson-2',
      title: 'HTML Fundamentals',
      description: 'Learn the basics of HTML markup',
      content: 'HTML is the foundation of web development...',
      duration: 45,
      order: 2,
      type: LessonType.VIDEO,
      courseId: course.id,
    },
  });

  // Create sample quiz
  await prisma.quiz.upsert({
    where: { id: 'quiz-1' },
    update: {},
    create: {
      id: 'quiz-1',
      title: 'HTML Fundamentals Quiz',
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'What does HTML stand for?',
          options: [
            'HyperText Markup Language',
            'High Tech Modern Language',
            'Home Tool Markup Language',
            'Hyperlink and Text Markup Language'
          ],
          correctAnswer: 0
        },
        {
          id: 'q2',
          type: 'true_false',
          question: 'HTML is a programming language.',
          correctAnswer: false
        }
      ],
      lessonId: lesson2.id,
    },
  });

  // Create sample enrollment
  await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: course.id,
      },
    },
    update: {},
    create: {
      userId: student.id,
      courseId: course.id,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin:', admin.email, '(password: admin123)');
  console.log('👨‍🏫 Teacher:', teacher.email, '(password: teacher123)');
  console.log('👨‍🎓 Student:', student.email, '(password: student123)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });