import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Play, Users, Star } from 'lucide-react'
import { useCourses } from '../hooks/useCourses'
import { Course } from '../types'

export const Courses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)

  const { data: courses, isLoading, error } = useCourses({
    page: currentPage,
    limit: 12,
    sortBy,
    sortOrder,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
        <p className="text-gray-600 mt-2">
          Discover and enroll in courses to enhance your skills
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input"
              >
                <option value="createdAt">Newest</option>
                <option value="title">Title</option>
                <option value="price">Price</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="input"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
              <button
                type="button"
                className="btn-secondary flex items-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
              <div className="card-body">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load courses</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses?.data?.map((course: Course) => (
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
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                      {course.title}
                    </h3>
                    <span className="text-lg font-bold text-primary-600 ml-2">
                      ${course.price}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Users className="w-4 h-4 mr-1" />
                    <span className="mr-4">{course._count.enrollments} students</span>
                    <Star className="w-4 h-4 mr-1" />
                    <span>4.8 (123)</span>
                  </div>
                  
                  <div className="text-sm text-gray-500 mb-4">
                    By {course.instructor.firstName} {course.instructor.lastName}
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

          {/* Pagination */}
          {courses?.pagination && courses.pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <nav className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary btn-sm disabled:opacity-50"
                >
                  Previous
                </button>
                
                {[...Array(courses.pagination.totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`btn-sm ${
                      currentPage === i + 1
                        ? 'btn-primary'
                        : 'btn-secondary'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(Math.min(courses.pagination.totalPages, currentPage + 1))}
                  disabled={currentPage === courses.pagination.totalPages}
                  className="btn-secondary btn-sm disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  )
}