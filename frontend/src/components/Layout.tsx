import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useAuthContext } from '../contexts/AuthContext'

export const Layout: React.FC = () => {
  const { user } = useAuthContext()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}