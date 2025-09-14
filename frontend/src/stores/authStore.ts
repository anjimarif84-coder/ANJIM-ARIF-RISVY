import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../services/api'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'TEACHER' | 'STUDENT'
  avatar?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  updateUser: (user: User) => void
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/login', { email, password })
          const { user, accessToken, refreshToken } = response.data
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
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
          const response = await api.post('/auth/register', data)
          const { user, accessToken, refreshToken } = response.data
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        const { accessToken } = get()
        if (accessToken) {
          api.post('/auth/logout').catch(() => {})
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      checkAuth: async () => {
        const { accessToken } = get()
        if (!accessToken) {
          set({ isAuthenticated: false })
          return
        }

        set({ isLoading: true })
        try {
          const response = await api.get('/auth/me')
          set({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      updateUser: (user: User) => {
        set({ user })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)