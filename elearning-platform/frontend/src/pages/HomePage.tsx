import { Link } from 'react-router-dom'
import { 
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
  TrophyIcon,
  PlayCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

export const HomePage = () => {
  const features = [
    {
      icon: BookOpenIcon,
      title: 'Expert-Led Courses',
      description: 'Learn from industry experts with years of real-world experience.',
    },
    {
      icon: PlayCircleIcon,
      title: 'Interactive Video Lessons',
      description: 'Engage with high-quality video content and interactive quizzes.',
    },
    {
      icon: TrophyIcon,
      title: 'Certificates & Achievements',
      description: 'Earn certificates and track your progress as you complete courses.',
    },
    {
      icon: UserGroupIcon,
      title: 'Community Learning',
      description: 'Connect with fellow learners and instructors in our community.',
    },
  ]

  const stats = [
    { label: 'Students', value: '10,000+' },
    { label: 'Courses', value: '500+' },
    { label: 'Instructors', value: '100+' },
    { label: 'Success Rate', value: '95%' },
  ]

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Learn Without Limits
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Master new skills with our comprehensive online courses. 
              Join thousands of learners advancing their careers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/courses" className="btn bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 text-lg">
                Explore Courses
              </Link>
              <Link to="/signup" className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 text-lg">
                Start Learning Today
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative background */}
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We provide everything you need to succeed in your learning journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-full mb-4">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Getting started is simple. Follow these three easy steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Choose Your Course
              </h3>
              <p className="text-gray-600">
                Browse our extensive catalog and find the perfect course for your goals.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start Learning
              </h3>
              <p className="text-gray-600">
                Access video lessons, complete assignments, and take quizzes at your own pace.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Get Certified
              </h3>
              <p className="text-gray-600">
                Complete the course and earn your certificate to showcase your new skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AcademicCapIcon className="h-16 w-16 mx-auto mb-6 text-primary-200" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students who have transformed their careers through our courses.
          </p>
          <Link 
            to="/signup" 
            className="btn bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 text-lg inline-flex items-center"
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  )
}