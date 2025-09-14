import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Play, Clock, Users, Star, CheckCircle, Lock } from 'lucide-react'
import { useCourse } from '../hooks/useCourse'
import { useEnrollments } from '../hooks/useEnrollments'
import { useAuthContext } from '../contexts/AuthContext'
import { StripeCheckout } from '../components/StripeCheckout'

export const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthContext()
  const [showCheckout, setShowCheckout] = useState(false)
  
  const { data: course, isLoading } = useCourse(id!)
  const { data: enrollments } = useEnrollments()
  
  const isEnrolled = enrollments?.some(
    (enrollment) => enrollment.courseId === id
  )

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Course not found</p>
      </div>
    )
  }

  const totalDuration = course.lessons?.reduce(
    (sum, lesson) => sum + (lesson.duration || 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {course.title}
              </h1>
              <p className="text-gray-600 mb-6">{course.description}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {course._count?.enrollments || 0} students
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {totalDuration} minutes
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  4.8 (123 reviews)
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                Created by {course.instructor.firstName} {course.instructor.lastName}
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="card">
                <div className="card-body text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    ${course.price}
                  </div>
                  
                  {isEnrolled ? (
                    <Link
                      to={`/courses/${course.id}/learn`}
                      className="btn-primary w-full flex items-center justify-center"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Continue Learning
                    </Link>
                  ) : (
                    <button
                      onClick={() => setShowCheckout(true)}
                      className="btn-primary w-full"
                    >
                      Enroll Now
                    </button>
                  )}
                  
                  <div className="mt-4 text-sm text-gray-500">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                      Lifetime access
                    </div>
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                      Certificate of completion
                    </div>
                    <div className="flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                      30-day money-back guarantee
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* What you'll learn */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-xl font-semibold">What you'll learn</h2>
            </div>
            <div className="card-body">
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Master the fundamentals of web development</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Build responsive and interactive websites</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Understand modern JavaScript concepts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Deploy your projects to the web</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Course Curriculum */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Course Curriculum</h2>
            </div>
            <div className="card-body p-0">
              {course.lessons?.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-primary-600 font-medium text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {lesson.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {lesson.duration} minutes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {isEnrolled ? (
                      <Play className="w-5 h-5 text-primary-600" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          {/* Instructor */}
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="font-semibold">Instructor</h3>
            </div>
            <div className="card-body">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-medium">
                    {course.instructor.firstName[0]}{course.instructor.lastName[0]}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium">
                    {course.instructor.firstName} {course.instructor.lastName}
                  </h4>
                  <p className="text-sm text-gray-500">Senior Developer</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Experienced developer with 10+ years in web development and teaching.
              </p>
            </div>
          </div>

          {/* Reviews */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">Student Reviews</h3>
            </div>
            <div className="card-body">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-gray-900">4.8</div>
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-500">Based on 123 reviews</p>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span>5 stars</span>
                    <span>85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span>4 stars</span>
                    <span>12%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '12%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Checkout Modal */}
      {showCheckout && (
        <StripeCheckout
          courseId={course.id}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  )
}