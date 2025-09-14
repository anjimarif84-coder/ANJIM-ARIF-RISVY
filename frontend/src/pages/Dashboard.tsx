import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import {
  BookOpenIcon,
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const { user } = useAuthStore()

  const { data: dashboardData, isLoading } = useQuery(
    'dashboard',
    async () => {
      const response = await api.get('/users/dashboard')
      return response.data
    }
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-2 text-gray-600">
            Continue your learning journey and track your progress.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpenIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Enrolled Courses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.stats?.totalEnrollments || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Overall Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(dashboardData?.progress?.overallProgress || 0)}%
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrophyIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Quiz Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.stats?.averageQuizScore || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed Lessons</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.progress?.completedLessons || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Enrollments */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Enrollments</h2>
            {dashboardData?.enrollments?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.enrollments.map((enrollment: any) => (
                  <div key={enrollment.id} className="flex items-center space-x-4">
                    {enrollment.course.thumbnail ? (
                      <img
                        src={enrollment.course.thumbnail}
                        alt={enrollment.course.title}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center">
                        <span className="text-white font-bold">
                          {enrollment.course.title.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {enrollment.course.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        by {enrollment.course.instructor.firstName} {enrollment.course.instructor.lastName}
                      </p>
                    </div>
                    <Link
                      to={`/courses/${enrollment.course.id}`}
                      className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                    >
                      Continue
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No enrollments yet</p>
                <Link to="/courses" className="btn btn-primary">
                  Browse Courses
                </Link>
              </div>
            )}
          </div>

          {/* Recent Quiz Results */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Quiz Results</h2>
            {dashboardData?.quizResults?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.quizResults.map((result: any) => (
                  <div key={result.id} className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {result.quiz.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {result.quiz.lesson.course.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {result.score}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(result.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No quiz results yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        {dashboardData?.progress && (
          <div className="mt-8">
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Learning Progress</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm text-gray-500">
                    {dashboardData.progress.completedLessons} of {dashboardData.progress.totalLessons} lessons
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${dashboardData.progress.overallProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}