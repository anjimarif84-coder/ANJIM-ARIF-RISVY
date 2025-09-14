import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { useAuthStore } from '../store/authStore'
import { useAuth } from '../hooks/useAuth'

interface AuthContextType {
  user: any
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading, setAuth, clearAuth, setLoading } = useAuthStore()
  const { login: loginApi, register: registerApi, refreshToken: refreshTokenApi } = useAuth()

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const response = await loginApi({ email, password })
      setAuth(response.user, response.tokens)
    } finally {
      setLoading(false)
    }
  }

  const register = async (data: any) => {
    setLoading(true)
    try {
      const response = await registerApi(data)
      setAuth(response.user, response.tokens)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearAuth()
  }

  const refreshToken = async () => {
    const tokens = useAuthStore.getState().tokens
    if (tokens?.refreshToken) {
      try {
        const response = await refreshTokenApi(tokens.refreshToken)
        useAuthStore.getState().setAuth(useAuthStore.getState().user!, response.tokens)
      } catch (error) {
        clearAuth()
      }
    }
  }

  // Auto-refresh token
  useEffect(() => {
    if (isAuthenticated && tokens?.refreshToken) {
      const interval = setInterval(() => {
        refreshToken()
      }, 14 * 60 * 1000) // Refresh every 14 minutes

      return () => clearInterval(interval)
    }
  }, [isAuthenticated, tokens?.refreshToken])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}