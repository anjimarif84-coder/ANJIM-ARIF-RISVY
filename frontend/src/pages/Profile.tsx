import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { User, Camera, Save, Key } from 'lucide-react'
import { useAuthContext } from '../contexts/AuthContext'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface ProfileForm {
  firstName: string
  lastName: string
  avatar?: string
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuthContext()
  const { changePassword } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      avatar: user?.avatar || '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordForm>()

  const newPassword = watch('newPassword')

  const onProfileSubmit = async (data: ProfileForm) => {
    setIsLoading(true)
    try {
      // Update profile logic here
      updateUser(data)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsLoading(true)
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      toast.success('Password changed successfully!')
      resetPassword()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'password'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Key className="w-4 h-4 inline mr-2" />
            Change Password
          </button>
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Profile Information</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.firstName}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl font-medium">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    className="absolute -bottom-2 -right-2 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-gray-500">{user?.email}</p>
                  <p className="text-sm text-gray-500 capitalize">
                    {user?.role?.toLowerCase()}
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="label">
                    First Name
                  </label>
                  <input
                    {...registerProfile('firstName', {
                      required: 'First name is required',
                    })}
                    type="text"
                    className={`input ${profileErrors.firstName ? 'input-error' : ''}`}
                  />
                  {profileErrors.firstName && (
                    <p className="error-text">{profileErrors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="label">
                    Last Name
                  </label>
                  <input
                    {...registerProfile('lastName', {
                      required: 'Last name is required',
                    })}
                    type="text"
                    className={`input ${profileErrors.lastName ? 'input-error' : ''}`}
                  />
                  {profileErrors.lastName && (
                    <p className="error-text">{profileErrors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="label">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input bg-gray-50 text-gray-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Email address cannot be changed
                </p>
              </div>

              <div>
                <label htmlFor="avatar" className="label">
                  Avatar URL
                </label>
                <input
                  {...registerProfile('avatar')}
                  type="url"
                  className="input"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Change Password</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="label">
                  Current Password
                </label>
                <input
                  {...registerPassword('currentPassword', {
                    required: 'Current password is required',
                  })}
                  type="password"
                  className={`input ${passwordErrors.currentPassword ? 'input-error' : ''}`}
                />
                {passwordErrors.currentPassword && (
                  <p className="error-text">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="newPassword" className="label">
                  New Password
                </label>
                <input
                  {...registerPassword('newPassword', {
                    required: 'New password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                  type="password"
                  className={`input ${passwordErrors.newPassword ? 'input-error' : ''}`}
                />
                {passwordErrors.newPassword && (
                  <p className="error-text">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm New Password
                </label>
                <input
                  {...registerPassword('confirmPassword', {
                    required: 'Please confirm your new password',
                    validate: (value) =>
                      value === newPassword || 'Passwords do not match',
                  })}
                  type="password"
                  className={`input ${passwordErrors.confirmPassword ? 'input-error' : ''}`}
                />
                {passwordErrors.confirmPassword && (
                  <p className="error-text">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center"
                >
                  <Key className="w-4 h-4 mr-2" />
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}