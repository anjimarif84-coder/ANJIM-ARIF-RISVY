import { Request } from 'express';
import { User } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface CreateCourseData {
  title: string;
  description: string;
  shortDescription?: string;
  price: number;
  categoryId?: string;
}

export interface CreateLessonData {
  title: string;
  description?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  courseId: string;
}

export interface CreateQuizData {
  title: string;
  description?: string;
  courseId: string;
  passingScore?: number;
  timeLimit?: number;
  questions: CreateQuizQuestionData[];
}

export interface CreateQuizQuestionData {
  question: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options?: string[];
  correctAnswer: string;
  points?: number;
  order: number;
}

export interface SignedUrlResponse {
  signedUrl: string;
  key: string;
  expiresIn: number;
}

export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
}

export interface QuizSubmission {
  answers: Record<string, string>;
}

export interface ProgressUpdate {
  lessonId: string;
  watchedTime: number;
  isCompleted?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}