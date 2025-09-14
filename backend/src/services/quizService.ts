import { PrismaClient, Quiz, Question, QuizResponse } from '@prisma/client';
import { QuizResponseRequest } from '../types';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class QuizService {
  static async getQuiz(quizId: string, userId?: string): Promise<Quiz & { questions: Question[]; userResponse?: QuizResponse }> {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        course: {
          include: {
            enrollments: userId ? {
              where: { userId },
            } : false,
          },
        },
      },
    });

    if (!quiz) {
      throw createError('Quiz not found', 404);
    }

    // Check if user is enrolled in the course
    if (userId && quiz.course.enrollments.length === 0) {
      throw createError('Not enrolled in this course', 403);
    }

    // Get user's previous response if exists
    let userResponse: QuizResponse | undefined;
    if (userId) {
      userResponse = await prisma.quizResponse.findUnique({
        where: {
          userId_quizId: {
            userId,
            quizId,
          },
        },
      });
    }

    return { ...quiz, userResponse };
  }

  static async submitQuizResponse(quizId: string, userId: string, data: QuizResponseRequest): Promise<QuizResponse> {
    // Get quiz with questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
        course: {
          include: {
            enrollments: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw createError('Quiz not found', 404);
    }

    // Check if user is enrolled
    if (quiz.course.enrollments.length === 0) {
      throw createError('Not enrolled in this course', 403);
    }

    // Check if already submitted
    const existingResponse = await prisma.quizResponse.findUnique({
      where: {
        userId_quizId: {
          userId,
          quizId,
        },
      },
    });

    if (existingResponse && existingResponse.completed) {
      throw createError('Quiz already submitted', 409);
    }

    // Calculate score
    let score = 0;
    let totalScore = 0;

    for (const question of quiz.questions) {
      totalScore += question.points;
      const userAnswer = data.answers[question.id];
      const correctAnswer = JSON.parse(question.correctAnswer);

      if (this.isAnswerCorrect(userAnswer, correctAnswer, question.type)) {
        score += question.points;
      }
    }

    // Create or update response
    const response = await prisma.quizResponse.upsert({
      where: {
        userId_quizId: {
          userId,
          quizId,
        },
      },
      update: {
        answers: JSON.stringify(data.answers),
        score,
        totalScore,
        completed: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        quizId,
        answers: JSON.stringify(data.answers),
        score,
        totalScore,
        completed: true,
        completedAt: new Date(),
      },
    });

    return response;
  }

  static async getUserQuizResponses(userId: string): Promise<QuizResponse[]> {
    const responses = await prisma.quizResponse.findMany({
      where: { userId },
      include: {
        quiz: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    return responses;
  }

  static async getQuizResults(quizId: string, instructorId: string): Promise<QuizResponse[]> {
    // Verify instructor owns the course
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: true,
      },
    });

    if (!quiz || quiz.course.instructorId !== instructorId) {
      throw createError('Quiz not found or not authorized', 404);
    }

    const responses = await prisma.quizResponse.findMany({
      where: { quizId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    return responses;
  }

  private static isAnswerCorrect(userAnswer: any, correctAnswer: any, questionType: string): boolean {
    if (questionType === 'multiple_choice') {
      return Array.isArray(correctAnswer) 
        ? correctAnswer.includes(userAnswer)
        : userAnswer === correctAnswer;
    }
    
    if (questionType === 'true_false') {
      return userAnswer === correctAnswer;
    }
    
    if (questionType === 'text') {
      // For text questions, we'll do a simple string comparison
      // In a real app, you might want more sophisticated text matching
      return userAnswer?.toString().toLowerCase().trim() === correctAnswer?.toString().toLowerCase().trim();
    }

    return false;
  }
}