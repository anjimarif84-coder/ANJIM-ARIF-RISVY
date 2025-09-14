# E-Learning Platform

A production-ready e-learning web application built with modern technologies and best practices.

## 🚀 Features

- **User Authentication**: JWT-based auth with refresh tokens and role-based access control
- **Course Management**: Full CRUD operations for courses, lessons, and quizzes
- **Video Streaming**: Secure signed URLs for video content via AWS S3 + CloudFront
- **Student Progress**: Track enrollment and learning progress
- **Quiz System**: Interactive quizzes with results tracking
- **Payment Integration**: Stripe Checkout with webhook handling
- **Notifications**: Email notifications via Nodemailer/SES
- **Real-time Updates**: WebSocket support for live features
- **Responsive Design**: Mobile-first UI with Tailwind CSS

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Query** for state management and caching
- **React Router** for navigation
- **Stripe Elements** for payments
- **Framer Motion** for animations

### Backend
- **Node.js** with Express and TypeScript
- **PostgreSQL** with Prisma ORM
- **Redis** for caching and sessions
- **JWT** for authentication
- **Stripe** for payments
- **AWS S3** for file storage
- **CloudFront** for CDN
- **Nodemailer** for emails

### Infrastructure
- **Docker** for containerization
- **AWS ECS Fargate** for backend hosting
- **Vercel** for frontend hosting
- **AWS RDS** for PostgreSQL
- **AWS ElastiCache** for Redis
- **Terraform** for infrastructure as code
- **GitHub Actions** for CI/CD

## 📁 Project Structure

```
elearning-platform/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript types
│   │   └── test/            # Unit tests
│   ├── prisma/              # Database schema and migrations
│   └── Dockerfile
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   └── types/           # TypeScript types
│   ├── cypress/             # E2E tests
│   └── Dockerfile
├── infrastructure/          # Terraform configurations
├── .github/workflows/       # GitHub Actions
└── docker-compose.yml       # Local development
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd elearning-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

4. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   cd backend
   npm run db:migrate
   npm run db:seed
   ```

6. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432
   - Redis: localhost:6379

### Default Credentials

- **Admin**: admin@elearning.com / admin123
- **Teacher**: teacher@elearning.com / teacher123
- **Student**: student@elearning.com / student123

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                 # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                 # Unit tests
npm run test:ui         # Test UI
npm run e2e             # E2E tests
npm run e2e:headless    # Headless E2E
```

## 🚀 Deployment

### AWS Infrastructure

1. **Set up AWS credentials**
   ```bash
   aws configure
   ```

2. **Initialize Terraform**
   ```bash
   cd infrastructure
   terraform init
   ```

3. **Plan and apply infrastructure**
   ```bash
   terraform plan
   terraform apply
   ```

4. **Deploy with GitHub Actions**
   - Push to `main` branch
   - CI/CD pipeline will automatically deploy

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
CLOUDFRONT_DOMAIN=your-cloudfront-domain
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
SENTRY_DSN=your-sentry-dsn
```

#### Frontend (.env)
```env
VITE_API_URL=https://api.yourdomain.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## 📊 Database Schema

### Core Tables
- **users**: User accounts and profiles
- **courses**: Course information and metadata
- **lessons**: Individual course lessons
- **quizzes**: Quiz definitions and questions
- **enrollments**: Student course enrollments
- **progress**: Learning progress tracking
- **payments**: Payment records and status
- **notifications**: User notifications

### Key Relationships
- Users can have multiple enrollments
- Courses contain multiple lessons and quizzes
- Students track progress through lessons
- Payments are linked to enrollments

## 🔒 Security Features

- **Authentication**: JWT with refresh token rotation
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: API rate limiting with different tiers
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Protection**: Parameterized queries with Prisma
- **XSS Protection**: Content Security Policy and input sanitization
- **HTTPS**: SSL/TLS encryption in production
- **Security Headers**: Helmet.js for security headers
- **Audit Logging**: Comprehensive security event logging

## 📈 Monitoring & Observability

- **Error Tracking**: Sentry integration
- **Performance Monitoring**: Request timing and slow query detection
- **Health Checks**: Comprehensive health check endpoints
- **Logging**: Structured logging with correlation IDs
- **Metrics**: Custom metrics collection
- **Alerting**: Automated alerts for critical issues

## 🧪 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Course Endpoints
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (teacher/admin)
- `PUT /api/courses/:id` - Update course (teacher/admin)
- `DELETE /api/courses/:id` - Delete course (teacher/admin)

### Enrollment Endpoints
- `POST /api/enrollments/:courseId` - Enroll in course
- `GET /api/enrollments/my-enrollments` - Get user enrollments
- `POST /api/enrollments/:enrollmentId/progress/:lessonId` - Update progress

### Payment Endpoints
- `POST /api/payments/create-payment-intent` - Create Stripe payment
- `POST /api/payments/webhook` - Stripe webhook handler

## 🔧 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write comprehensive tests
- Use meaningful commit messages
- Document complex functions

### Git Workflow
- Feature branches from `develop`
- Pull requests for code review
- Automated testing on PRs
- Deploy to staging for testing
- Merge to `main` for production

### Performance
- Use database indexes for queries
- Implement caching strategies
- Optimize images and assets
- Monitor bundle sizes
- Use CDN for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the development team

## 🗺 Roadmap

### Phase 1 (Current)
- ✅ Core authentication and authorization
- ✅ Course management system
- ✅ Basic payment integration
- ✅ Student progress tracking

### Phase 2 (Next)
- 🔄 Live video streaming
- 🔄 Discussion forums
- 🔄 Mobile app (React Native)
- 🔄 Advanced analytics

### Phase 3 (Future)
- 📋 AI-powered recommendations
- 📋 Virtual classrooms
- 📋 Certification system
- 📋 Multi-language support

---

**Built with ❤️ by the E-Learning Platform Team**