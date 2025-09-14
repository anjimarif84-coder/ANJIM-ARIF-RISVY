import { useQuery } from 'react-query'
import { apiClient } from '../lib/api'
import { Course, PaginatedResponse } from '../types'

interface UseCoursesParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export const useCourses = (params: UseCoursesParams = {}) => {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      
      if (params.page) searchParams.append('page', params.page.toString())
      if (params.limit) searchParams.append('limit', params.limit.toString())
      if (params.sortBy) searchParams.append('sortBy', params.sortBy)
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder)
      if (params.search) searchParams.append('search', params.search)

      const response = await apiClient.get<PaginatedResponse<Course>>(
        `/courses?${searchParams.toString()}`
      )
      return response
    },
  })
}