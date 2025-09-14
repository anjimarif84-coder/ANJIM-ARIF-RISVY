import { useQuery } from 'react-query'
import { apiClient } from '../lib/api'
import { Course } from '../types'

export const useCourse = (courseId: string) => {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        data: Course & { isEnrolled?: boolean }
      }>(`/courses/${courseId}`)
      return response.data
    },
    enabled: !!courseId,
  })
}