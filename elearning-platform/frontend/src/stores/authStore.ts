import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import { User, AuthTokens, LoginCredentials, RegisterData } from '@/types'
import { authApi } from '@/services/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  accessToken: string | null
  refreshToken: string | null
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
  updateProfile: (user: User) => void
  initializeAuth: () => void
  setTokens: (tokens: AuthTokens) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      refreshToken: null,

      // Actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true })
        try {
          const response = await authApi.login(credentials)
          const { user, accessToken, refreshToken } = response.data
          
          // Store tokens in cookies for security
          Cookies.set('accessToken', accessToken, { expires: 1/96 }) // 15 minutes
          Cookies.set('refreshToken', refreshToken, { expires: 7 }) // 7 days
          
          set({
            user,
            isAuthenticated: true,
            accessToken,
            refreshToken,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true })
        try {
          const response = await authApi.register(data)
          const { user, accessToken, refreshToken } = response.data
          
          // Store tokens in cookies
          Cookies.set('accessToken', accessToken, { expires: 1/96 })
          Cookies.set('refreshToken', refreshToken, { expires: 7 })
          
          set({
            user,
            isAuthenticated: true,
            accessToken,
            refreshToken,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        const { refreshToken } = get()
        
        try {
          if (refreshToken) {
            await authApi.logout(refreshToken)
          }
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          // Clear tokens and state regardless of API call success
          Cookies.remove('accessToken')
          Cookies.remove('refreshToken')
          
          set({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
          })
        }
      },

      refreshAuth: async () => {
        const { refreshToken } = get()
        
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        try {
          const response = await authApi.refreshToken(refreshToken)
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data
          
          // Update cookies
          Cookies.set('accessToken', newAccessToken, { expires: 1/96 })
          Cookies.set('refreshToken', newRefreshToken, { expires: 7 })
          
          set({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          })
        } catch (error) {
          // If refresh fails, logout user
          get().clearAuth()
          throw error
        }
      },

      updateProfile: (user: User) => {
        set({ user })
      },

      initializeAuth: () => {
        const accessToken = Cookies.get('accessToken')
        const refreshToken = Cookies.get('refreshToken')
        
        if (accessToken && refreshToken) {
          set({
            accessToken,
            refreshToken,
            isAuthenticated: true,
          })
          
          // Fetch user profile
          authApi.getProfile()
            .then(response => {
              set({ user: response.data })
            })
            .catch(() => {
              // If profile fetch fails, clear auth
              get().clearAuth()
            })
        }
      },

      setTokens: (tokens: AuthTokens) => {
        const { accessToken, refreshToken } = tokens
        
        Cookies.set('accessToken', accessToken, { expires: 1/96 })
        Cookies.set('refreshToken', refreshToken, { expires: 7 })
        
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
        })
      },

      clearAuth: () => {
        Cookies.remove('accessToken')
        Cookies.remove('refreshToken')
        
        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
        })
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        // Only persist user data, not tokens (they're in cookies)
        user: state.user,
      }),
    }
  )
)