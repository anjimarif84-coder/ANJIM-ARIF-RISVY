import { PrismaClient, UserRole } from '@prisma/client';
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
  const course = await prisma.course.create({
    data: {
      title: 'Introduction to Web Development',
      description: 'Learn the fundamentals of web development including HTML, CSS, and JavaScript.',
      price: 99.99,
      status: 'PUBLISHED',
      instructorId: teacher.id,
    },
  });

  // Create sample lessons
  const lessons = await Promise.all([
    prisma.lesson.create({
      data: {
        title: 'Introduction to HTML',
        description: 'Learn the basics of HTML structure and elements.',
        content: 'HTML (HyperText Markup Language) is the standard markup language for creating web pages...',
        duration: 30,
        order: 1,
        type: 'VIDEO',
        courseId: course.id,
      },
    }),
    prisma.lesson.create({
      data: {
        title: 'CSS Fundamentals',
        description: 'Understanding CSS selectors, properties, and styling.',
        content: 'CSS (Cascading Style Sheets) is used to style and layout web pages...',
        duration: 45,
        order: 2,
        type: 'VIDEO',
        courseId: course.id,
      },
    }),
    prisma.lesson.create({
      data: {
        title: 'JavaScript Basics',
        description: 'Introduction to JavaScript programming concepts.',
        content: 'JavaScript is a programming language that enables interactive web pages...',
        duration: 60,
        order: 3,
        type: 'VIDEO',
        courseId: course.id,
      },
    }),
  ]);

  // Create sample quiz
  const quiz = await prisma.quiz.create({
    data: {
      title: 'HTML and CSS Quiz',
      description: 'Test your knowledge of HTML and CSS fundamentals.',
      courseId: course.id,
    },
  });

  // Create sample questions
  await Promise.all([
    prisma.question.create({
      data: {
        question: 'What does HTML stand for?',
        type: 'multiple_choice',
        options: ['HyperText Markup Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language'],
        correctAnswer: '["HyperText Markup Language"]',
        points: 1,
        order: 1,
        quizId: quiz.id,
      },
    }),
    prisma.question.create({
      data: {
        question: 'Which CSS property is used to change the text color?',
        type: 'multiple_choice',
        options: ['font-color', 'text-color', 'color'],
        correctAnswer: '["color"]',
        points: 1,
        order: 2,
        quizId: quiz.id,
      },
    }),
  ]);

  // Create sample enrollment
  await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: course.id,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin user: admin@elearning.com / admin123');
  console.log('👨‍🏫 Teacher user: teacher@elearning.com / teacher123');
  console.log('👨‍🎓 Student user: student@elearning.com / student123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });