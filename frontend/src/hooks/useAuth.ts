import { useMutation, useQuery } from 'react-query'
import { apiClient } from '../lib/api'
import { LoginCredentials, RegisterData, User, AuthTokens } from '../types'

export const useAuth = () => {
  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiClient.post<{
        success: boolean
        data: { user: User; tokens: AuthTokens }
        message: string
      }>('/auth/login', credentials)
      return response.data
    },
  })

  const register = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiClient.post<{
        success: boolean
        data: { user: User; tokens: AuthTokens }
        message: string
      }>('/auth/register', data)
      return response.data
    },
  })

  const refreshToken = useMutation({
    mutationFn: async (refreshToken: string) => {
      const response = await apiClient.post<{
        success: boolean
        data: { tokens: AuthTokens }
        message: string
      }>('/auth/refresh', { refreshToken })
      return response.data
    },
  })

  const logout = useMutation({
    mutationFn: async () => {
      const tokens = useAuthStore.getState().tokens
      if (tokens?.refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken: tokens.refreshToken })
      }
    },
  })

  const changePassword = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiClient.post<{
        success: boolean
        message: string
      }>('/auth/change-password', data)
      return response.data
    },
  })

  const getCurrentUser = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        data: { user: User }
      }>('/auth/me')
      return response.data
    },
    enabled: false, // Only run when explicitly called
  })

  return {
    login: login.mutateAsync,
    register: register.mutateAsync,
    refreshToken: refreshToken.mutateAsync,
    logout: logout.mutateAsync,
    changePassword: changePassword.mutateAsync,
    getCurrentUser: getCurrentUser.refetch,
    isLoading: login.isLoading || register.isLoading || refreshToken.isLoading,
    error: login.error || register.error || refreshToken.error,
  }
}

// Import useAuthStore here to avoid circular dependency
import { useAuthStore } from '../store/authStore'