import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

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
  _count: {
    lessons: number
    enrollments: number
  }
}

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const { isAuthenticated } = useAuthStore()

  const { data, isLoading, error } = useQuery(
    ['courses', page, searchTerm],
    async () => {
      const response = await api.get('/courses', {
        params: {
          page,
          limit: 12,
          search: searchTerm || undefined,
        },
      })
      return response.data
    },
    {
      keepPreviousData: true,
    }
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Browse Courses
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Discover courses that will help you advance your career
          </p>
        </div>

        {/* Search */}
        <div className="mt-8 max-w-md mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search courses..."
            />
          </form>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-12 text-center">
            <p className="text-red-600">Failed to load courses. Please try again.</p>
          </div>
        ) : (
          <>
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {data?.courses?.map((course: Course) => (
                <div key={course.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="h-48 w-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {course.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-center mb-2">
                      <div className="flex-shrink-0">
                        {course.instructor.avatar ? (
                          <img
                            className="h-8 w-8 rounded-full"
                            src={course.instructor.avatar}
                            alt={`${course.instructor.firstName} ${course.instructor.lastName}`}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {course.instructor.firstName.charAt(0)}
                              {course.instructor.lastName.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {course.instructor.firstName} {course.instructor.lastName}
                        </p>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {course.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {course.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <span>{course._count.lessons} lessons</span>
                        <span className="mx-2">•</span>
                        <span>{course._count.enrollments} students</span>
                      </div>
                      <div className="text-lg font-bold text-primary-600">
                        ${course.price}
                      </div>
                    </div>
                    
                    <Link
                      to={`/courses/${course.id}`}
                      className="w-full btn btn-primary text-center block"
                    >
                      View Course
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.pages > 1 && (
              <div className="mt-12 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {[...Array(data.pagination.pages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        page === i + 1
                          ? 'text-white bg-primary-600 border border-primary-600'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.pagination.pages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}