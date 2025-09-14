import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  BookOpen, 
  BarChart3, 
  User, 
  Settings, 
  GraduationCap,
  Users,
  FileText
} from 'lucide-react'
import { useAuthContext } from '../contexts/AuthContext'

export const Sidebar: React.FC = () => {
  const location = useLocation()
  const { user } = useAuthContext()

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    ...(user?.role === 'TEACHER' || user?.role === 'ADMIN' ? [
      { name: 'My Courses', href: '/instructor/courses', icon: GraduationCap },
      { name: 'Students', href: '/instructor/students', icon: Users },
    ] : []),
    ...(user?.role === 'ADMIN' ? [
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Reports', href: '/admin/reports', icon: FileText },
    ] : []),
  ]

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 lg:pb-0 lg:bg-white lg:border-r lg:border-gray-200">
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}