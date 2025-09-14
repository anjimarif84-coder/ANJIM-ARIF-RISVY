import { Request } from 'express';
import { User, UserRole } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  thumbnail?: string;
  price: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface CreateLessonRequest {
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT';
}

export interface CreateQuizRequest {
  title: string;
  description?: string;
  questions: CreateQuestionRequest[];
}

export interface CreateQuestionRequest {
  question: string;
  type: 'multiple_choice' | 'true_false' | 'text';
  options?: string[];
  correctAnswer: string;
  points?: number;
  order: number;
}

export interface QuizResponseRequest {
  answers: Record<string, string | string[]>;
}

export interface PaymentRequest {
  courseId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

export interface AWSConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  s3Bucket: string;
  cloudfrontDomain: string;
}

export interface EmailConfig {
  from: string;
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}