import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'
import {
  ApiResponse,
  PaginatedResponse,
  User,
  Course,
  LoginCredentials,
  RegisterData,
  CourseFilters,
  CreateCourseData,
  UpdateProfileData,
  ChangePasswordData,
  AuthTokens,
  Enrollment,
  Payment,
  SignedUrlResponse,
  StripeCheckoutSession,
} from '@/types'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = Cookies.get('accessToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = Cookies.get('refreshToken')
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken)
              const { accessToken, refreshToken: newRefreshToken } = response.data

              Cookies.set('accessToken', accessToken, { expires: 1/96 })
              Cookies.set('refreshToken', newRefreshToken, { expires: 7 })

              originalRequest.headers.Authorization = `Bearer ${accessToken}`
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            Cookies.remove('accessToken')
            Cookies.remove('refreshToken')
            window.location.href = '/login'
          }
        }

        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User } & AuthTokens>> {
    const response = await this.client.post('/auth/login', credentials)
    return response.data
  }

  async register(data: RegisterData): Promise<ApiResponse<{ user: User } & AuthTokens>> {
    const response = await this.client.post('/auth/register', data)
    return response.data
  }

  async logout(refreshToken: string): Promise<ApiResponse> {
    const response = await this.client.post('/auth/logout', { refreshToken })
    return response.data
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    const response = await this.client.post('/auth/refresh', { refreshToken })
    return response.data
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await this.client.get('/auth/profile')
    return response.data
  }

  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<User>> {
    const response = await this.client.put('/auth/profile', data)
    return response.data
  }

  async changePassword(data: ChangePasswordData): Promise<ApiResponse> {
    const response = await this.client.put('/auth/change-password', data)
    return response.data
  }

  // Course endpoints
  async getCourses(filters?: CourseFilters): Promise<PaginatedResponse<Course>> {
    const response = await this.client.get('/courses', { params: filters })
    return response.data
  }

  async getCourse(id: string): Promise<ApiResponse<Course>> {
    const response = await this.client.get(`/courses/${id}`)
    return response.data
  }

  async createCourse(data: CreateCourseData): Promise<ApiResponse<Course>> {
    const response = await this.client.post('/courses', data)
    return response.data
  }

  async updateCourse(id: string, data: Partial<CreateCourseData>): Promise<ApiResponse<Course>> {
    const response = await this.client.put(`/courses/${id}`, data)
    return response.data
  }

  async deleteCourse(id: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/courses/${id}`)
    return response.data
  }

  async getMyCourses(filters?: CourseFilters): Promise<PaginatedResponse<Course>> {
    const response = await this.client.get('/courses/my/courses', { params: filters })
    return response.data
  }

  async publishCourse(id: string): Promise<ApiResponse<Course>> {
    const response = await this.client.patch(`/courses/${id}/publish`)
    return response.data
  }

  // Enrollment endpoints
  async getMyEnrollments(): Promise<ApiResponse<Enrollment[]>> {
    const response = await this.client.get('/enrollments/my')
    return response.data
  }

  async enrollInCourse(courseId: string): Promise<ApiResponse<Enrollment>> {
    const response = await this.client.post(`/enrollments/${courseId}`)
    return response.data
  }

  // Payment endpoints
  async createCheckoutSession(courseId: string): Promise<ApiResponse<StripeCheckoutSession>> {
    const response = await this.client.post('/payments/create-checkout-session', { courseId })
    return response.data
  }

  async getMyPayments(): Promise<ApiResponse<Payment[]>> {
    const response = await this.client.get('/payments/my')
    return response.data
  }

  // Upload endpoints
  async getVideoUploadUrl(courseId: string, lessonId: string, filename: string, contentType: string): Promise<ApiResponse<SignedUrlResponse>> {
    const response = await this.client.post('/upload/video-upload-url', {
      courseId,
      lessonId,
      filename,
      contentType,
    })
    return response.data
  }

  async getThumbnailUploadUrl(courseId: string, filename: string, contentType: string): Promise<ApiResponse<SignedUrlResponse>> {
    const response = await this.client.post('/upload/thumbnail-upload-url', {
      courseId,
      filename,
      contentType,
    })
    return response.data
  }

  async getProfileImageUploadUrl(filename: string, contentType: string): Promise<ApiResponse<SignedUrlResponse>> {
    const response = await this.client.post('/upload/profile-image-upload-url', {
      filename,
      contentType,
    })
    return response.data
  }

  // Generic request method for custom endpoints
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client(config)
    return response.data
  }
}

// Create and export API client instance
const apiClient = new ApiClient()

// Export individual API modules for better organization
export const authApi = {
  login: apiClient.login.bind(apiClient),
  register: apiClient.register.bind(apiClient),
  logout: apiClient.logout.bind(apiClient),
  refreshToken: apiClient.refreshToken.bind(apiClient),
  getProfile: apiClient.getProfile.bind(apiClient),
  updateProfile: apiClient.updateProfile.bind(apiClient),
  changePassword: apiClient.changePassword.bind(apiClient),
}

export const courseApi = {
  getCourses: apiClient.getCourses.bind(apiClient),
  getCourse: apiClient.getCourse.bind(apiClient),
  createCourse: apiClient.createCourse.bind(apiClient),
  updateCourse: apiClient.updateCourse.bind(apiClient),
  deleteCourse: apiClient.deleteCourse.bind(apiClient),
  getMyCourses: apiClient.getMyCourses.bind(apiClient),
  publishCourse: apiClient.publishCourse.bind(apiClient),
}

export const enrollmentApi = {
  getMyEnrollments: apiClient.getMyEnrollments.bind(apiClient),
  enrollInCourse: apiClient.enrollInCourse.bind(apiClient),
}

export const paymentApi = {
  createCheckoutSession: apiClient.createCheckoutSession.bind(apiClient),
  getMyPayments: apiClient.getMyPayments.bind(apiClient),
}

export const uploadApi = {
  getVideoUploadUrl: apiClient.getVideoUploadUrl.bind(apiClient),
  getThumbnailUploadUrl: apiClient.getThumbnailUploadUrl.bind(apiClient),
  getProfileImageUploadUrl: apiClient.getProfileImageUploadUrl.bind(apiClient),
}

export default apiClient