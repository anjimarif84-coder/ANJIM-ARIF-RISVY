import { useQuery } from 'react-query'
import { apiClient } from '../lib/api'
import { Notification, PaginatedResponse } from '../types'

export const useNotifications = (params: { page?: number; limit?: number; unreadOnly?: boolean } = {}) => {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      
      if (params.page) searchParams.append('page', params.page.toString())
      if (params.limit) searchParams.append('limit', params.limit.toString())
      if (params.unreadOnly) searchParams.append('unreadOnly', 'true')

      const response = await apiClient.get<PaginatedResponse<Notification>>(
        `/notifications?${searchParams.toString()}`
      )
      return response
    },
  })
}

export const useUnreadNotificationsCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        data: { count: number }
      }>('/notifications/unread-count')
      return response.data
    },
  })
}