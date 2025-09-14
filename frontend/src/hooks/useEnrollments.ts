import { useQuery } from 'react-query'
import { apiClient } from '../lib/api'
import { Enrollment } from '../types'

export const useEnrollments = () => {
  return useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        data: Enrollment[]
      }>('/enrollments/my-enrollments')
      return response.data
    },
  })
}