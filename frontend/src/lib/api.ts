import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const tokens = useAuthStore.getState().tokens
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const tokens = useAuthStore.getState().tokens
            if (tokens?.refreshToken) {
              const response = await axios.post(`${API_URL}/api/auth/refresh`, {
                refreshToken: tokens.refreshToken,
              })

              const newTokens = response.data.data.tokens
              useAuthStore.getState().setAuth(useAuthStore.getState().user!, newTokens)

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            useAuthStore.getState().clearAuth()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        // Handle other errors
        if (error.response?.data?.error) {
          toast.error(error.response.data.error)
        } else if (error.message) {
          toast.error(error.message)
        }

        return Promise.reject(error)
      }
    )
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config)
    return response.data
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config)
    return response.data
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config)
    return response.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config)
    return response.data
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config)
    return response.data
  }
}

export const apiClient = new ApiClient()