import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { loadStripe } from '@stripe/stripe-js'
import toast from 'react-hot-toast'
import {
  PlayIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

interface Course {
  id: string
  title: string
  description: string
  thumbnail?: string
  price: number
  status: string
  instructor: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  lessons: Array<{
    id: string
    title: string
    description?: string
    duration?: number
    order: number
    type: string
  }>
  _count: {
    lessons: number
    enrollments: number
  }
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const [isEnrolled, setIsEnrolled] = useState(false)

  const { data: course, isLoading, error } = useQuery(
    ['course', id],
    async () => {
      const response = await api.get(`/courses/${id}`)
      return response.data
    },
    {
      enabled: !!id,
    }
  )

  const { data: enrollment } = useQuery(
    ['enrollment', id],
    async () => {
      if (!isAuthenticated || !id) return null
      const response = await api.get(`/enrollments/${id}/progress`)
      return response.data
    },
    {
      enabled: !!isAuthenticated && !!id,
    }
  )

  const enrollMutation = useMutation(
    async () => {
      const response = await api.post('/enrollments', { courseId: id })
      return response.data
    },
    {
      onSuccess: () => {
        setIsEnrolled(true)
        toast.success('Successfully enrolled in course!')
        queryClient.invalidateQueries(['enrollment', id])
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Enrollment failed')
      },
    }
  )

  const createCheckoutMutation = useMutation(
    async () => {
      const response = await api.post('/payments/create-checkout-session', {
        courseId: id,
      })
      return response.data
    },
    {
      onSuccess: async (data) => {
        const stripe = await stripePromise
        if (stripe) {
          const { error } = await stripe.redirectToCheckout({
            sessionId: data.sessionId,
          })
          if (error) {
            toast.error('Payment failed')
          }
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Payment failed')
      },
    }
  )

  useEffect(() => {
    if (enrollment) {
      setIsEnrolled(true)
    }
  }, [enrollment])

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (course?.price === 0) {
      enrollMutation.mutate()
    } else {
      createCheckoutMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h2>
          <p className="text-gray-600 mb-8">The course you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/courses')}
            className="btn btn-primary"
          >
            Browse Courses
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-r from-primary-400 to-primary-600 rounded-lg mb-6 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">
                    {course.title.charAt(0)}
                  </span>
                </div>
              )}
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {course.title}
              </h1>
              
              <div className="flex items-center mb-6">
                <div className="flex items-center">
                  {course.instructor.avatar ? (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={course.instructor.avatar}
                      alt={`${course.instructor.firstName} ${course.instructor.lastName}`}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {course.instructor.firstName.charAt(0)}
                        {course.instructor.lastName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {course.instructor.firstName} {course.instructor.lastName}
                    </p>
                    <p className="text-sm text-gray-500">Instructor</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 mb-6">
                <div className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {course._count.lessons} lessons
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <UserGroupIcon className="h-4 w-4 mr-1" />
                  {course._count.enrollments} students
                </div>
              </div>
              
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About this course</h2>
                <p className="text-gray-600 leading-relaxed">
                  {course.description}
                </p>
              </div>
            </div>

            {/* Lessons */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Content</h2>
              <div className="space-y-4">
                {course.lessons.map((lesson, index) => (
                  <div key={lesson.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {lesson.type === 'VIDEO' ? (
                            <PlayIcon className="h-6 w-6 text-primary-600" />
                          ) : (
                            <CheckCircleIcon className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {lesson.title}
                          </h3>
                          {lesson.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {lesson.duration && (
                        <div className="text-sm text-gray-500">
                          {lesson.duration} min
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="card p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    ${course.price}
                  </div>
                  <p className="text-gray-500">One-time payment</p>
                </div>
                
                {isEnrolled ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p className="text-green-600 font-medium">You're enrolled!</p>
                    </div>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="w-full btn btn-primary"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrollMutation.isLoading || createCheckoutMutation.isLoading}
                    className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrollMutation.isLoading || createCheckoutMutation.isLoading
                      ? 'Processing...'
                      : course.price === 0
                      ? 'Enroll for Free'
                      : 'Enroll Now'
                    }
                  </button>
                )}
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">What's included:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      {course._count.lessons} video lessons
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      Lifetime access
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      Certificate of completion
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      Mobile and desktop access
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}