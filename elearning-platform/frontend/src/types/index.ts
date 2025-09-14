export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'TEACHER' | 'STUDENT'
  isEmailVerified: boolean
  profileImageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Course {
  id: string
  title: string
  description: string
  shortDescription?: string
  thumbnailUrl?: string
  price: number
  isPublished: boolean
  teacherId: string
  categoryId?: string
  createdAt: string
  updatedAt: string
  teacher: {
    id: string
    firstName: string
    lastName: string
    profileImageUrl?: string
  }
  category?: {
    id: string
    name: string
  }
  lessons?: Lesson[]
  quizzes?: Quiz[]
  _count: {
    enrollments: number
    lessons?: number
    quizzes?: number
  }
  isEnrolled?: boolean
}

export interface Lesson {
  id: string
  title: string
  description?: string
  videoUrl?: string
  duration?: number
  order: number
  isPublished: boolean
  courseId: string
  createdAt: string
  updatedAt: string
  progress?: {
    isCompleted: boolean
    watchedTime: number
  }[]
}

export interface Quiz {
  id: string
  title: string
  description?: string
  courseId: string
  passingScore: number
  timeLimit?: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
  questions?: QuizQuestion[]
  responses?: QuizResponse[]
}

export interface QuizQuestion {
  id: string
  question: string
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER'
  options?: string[]
  correctAnswer: string
  points: number
  order: number
  quizId: string
}

export interface QuizResponse {
  id: string
  userId: string
  quizId: string
  answers: Record<string, string>
  score?: number
  isCompleted: boolean
  startedAt: string
  completedAt?: string
}

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  enrolledAt: string
  completedAt?: string
  course: Course
}

export interface Progress {
  id: string
  userId: string
  courseId: string
  lessonId?: string
  isCompleted: boolean
  watchedTime: number
  lastWatchedAt: string
}

export interface Payment {
  id: string
  userId: string
  courseId: string
  stripeSessionId: string
  stripePaymentId?: string
  amount: number
  currency: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  createdAt: string
  updatedAt: string
  course: Course
}

export interface Category {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: 'STUDENT' | 'TEACHER'
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface CourseFilters {
  search?: string
  category?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface CreateCourseData {
  title: string
  description: string
  shortDescription?: string
  price: number
  categoryId?: string
}

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  profileImageUrl?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface SignedUrlResponse {
  signedUrl: string
  key: string
  expiresIn: number
}

export interface StripeCheckoutSession {
  sessionId: string
  url: string
}