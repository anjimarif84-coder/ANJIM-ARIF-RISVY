import { Link } from 'react-router-dom'
import { BookOpen, Users, Award, Play } from 'lucide-react'
import { useAuthContext } from '../contexts/AuthContext'
import { useCourses } from '../hooks/useCourses'

export const Home: React.FC = () => {
  const { user } = useAuthContext()
  const { data: courses } = useCourses({ limit: 6 })

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-8 text-white">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-xl text-primary-100 mb-6">
            Continue your learning journey and discover new skills with our comprehensive courses.
          </p>
          <div className="flex space-x-4">
            <Link
              to="/courses"
              className="bg-white text-primary-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Browse Courses
            </Link>
            <Link
              to="/dashboard"
              className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-primary-600 transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{courses?.pagination?.total || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Students</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Certificates</p>
                <p className="text-2xl font-bold text-gray-900">567</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Courses */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Courses</h2>
          <Link
            to="/courses"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View all courses
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.data?.map((course) => (
            <div key={course.id} className="card hover:shadow-lg transition-shadow">
              {course.thumbnail && (
                <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="card-body">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {course.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-1" />
                    {course._count.enrollments} students
                  </div>
                  <span className="text-lg font-bold text-primary-600">
                    ${course.price}
                  </span>
                </div>
              </div>
              <div className="card-footer">
                <Link
                  to={`/courses/${course.id}`}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  <Play className="w-4 h-4 mr-2" />
                  View Course
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}