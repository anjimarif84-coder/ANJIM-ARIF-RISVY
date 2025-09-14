# E-Learning Platform

A comprehensive, production-ready e-learning platform built with modern technologies and best practices.

## 🚀 Features

### Core Features
- **User Authentication & Authorization**: JWT-based auth with role-based access control (Admin, Teacher, Student)
- **Course Management**: Full CRUD operations for courses, lessons, and quizzes
- **Video Streaming**: Secure video delivery with signed URLs via AWS S3 + CloudFront
- **Student Progress Tracking**: Real-time progress monitoring and analytics
- **Quiz System**: Interactive quizzes with automatic scoring and results tracking
- **Payment Processing**: Stripe integration with webhook handling for secure payments
- **Notifications**: Email notifications via Nodemailer/SES
- **Responsive Design**: Mobile-first design with Tailwind CSS

### Technical Features
- **Type Safety**: Full TypeScript implementation across frontend and backend
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Caching**: Redis for session management and performance optimization
- **Containerization**: Docker and Docker Compose for local development
- **CI/CD**: GitHub Actions for automated testing, building, and deployment
- **Infrastructure**: AWS ECS Fargate, RDS, ElastiCache, S3, CloudFront
- **Monitoring**: Sentry for error tracking, CloudWatch for logging
- **Security**: Comprehensive security measures following OWASP guidelines

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React/Vite)  │◄──►│   (Express)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   AWS ECS       │    │   AWS RDS       │
│   (Hosting)     │    │   (Container)   │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   AWS Services  │
                       │   S3, CloudFront│
                       │   ElastiCache   │
                       │   Secrets Mgr   │
                       └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **React Router** for navigation
- **Zustand** for state management
- **React Hook Form** for form handling
- **Stripe Elements** for payment processing

### Backend
- **Node.js** with Express and TypeScript
- **Prisma** ORM for database operations
- **PostgreSQL** as primary database
- **Redis** for caching and session storage
- **JWT** for authentication
- **Stripe** for payment processing
- **Nodemailer** for email notifications
- **AWS SDK** for S3 and CloudFront integration

### Infrastructure
- **Docker** for containerization
- **AWS ECS Fargate** for container orchestration
- **AWS RDS** for managed PostgreSQL
- **AWS ElastiCache** for Redis
- **AWS S3** for file storage
- **AWS CloudFront** for CDN
- **AWS Secrets Manager** for secrets
- **Terraform** for infrastructure as code

### DevOps
- **GitHub Actions** for CI/CD
- **Docker Compose** for local development
- **Sentry** for error monitoring
- **CloudWatch** for logging
- **Jest** for unit testing
- **Cypress** for E2E testing

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+
- AWS CLI (for deployment)
- Terraform (for infrastructure)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd elearning-platform
```

### 2. Environment Setup

```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Install dependencies
npm install
```

### 3. Configure Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/elearning_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Redis
REDIS_URL="redis://localhost:6379"

# AWS (for production)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
S3_BUCKET_NAME="elearning-videos"
CLOUDFRONT_DOMAIN="your-cloudfront-domain"

# Stripe
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Sentry
SENTRY_DSN="your-sentry-dsn"
```

#### Frontend (.env)
```env
VITE_API_URL="http://localhost:3001"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
```

### 4. Database Setup

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Run database migrations
cd backend
npm run db:migrate

# Seed the database
npm run db:seed
```

### 5. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:backend  # Backend on http://localhost:3001
npm run dev:frontend # Frontend on http://localhost:5173
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs

## 🐳 Docker Development

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Services

```bash
# Build and run backend
cd backend
docker build -t elearning-backend .
docker run -p 3001:3001 elearning-backend

# Build and run frontend
cd frontend
docker build -t elearning-frontend .
docker run -p 5173:80 elearning-frontend
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Frontend Tests

```bash
cd frontend

# Run unit tests
npm test

# Run tests with UI
npm run test:ui

# Run E2E tests
npm run e2e

# Run E2E tests headlessly
npm run e2e:headless
```

## 🚀 Deployment

### AWS Infrastructure

1. **Setup Terraform**

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

2. **Deploy Infrastructure**

```bash
terraform init
terraform plan
terraform apply
```

3. **Configure GitHub Secrets**

Add the following secrets to your GitHub repository:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_ACCOUNT_ID
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

### Manual Deployment

1. **Build and Push Docker Images**

```bash
# Build backend image
cd backend
docker build -t your-registry/elearning-backend:latest .
docker push your-registry/elearning-backend:latest

# Build frontend image
cd frontend
docker build -t your-registry/elearning-frontend:latest .
docker push your-registry/elearning-frontend:latest
```

2. **Deploy to ECS**

```bash
# Update ECS service
aws ecs update-service \
  --cluster elearning-cluster \
  --service elearning-backend-service \
  --force-new-deployment
```

3. **Deploy Frontend to Vercel**

```bash
cd frontend
npx vercel --prod
```

## 📊 Monitoring

### Health Checks

- **Application Health**: `GET /health`
- **Metrics**: `GET /health/metrics`
- **Endpoint Metrics**: `GET /health/metrics/:endpoint`

### Monitoring Tools

- **Sentry**: Error tracking and performance monitoring
- **CloudWatch**: Logs and metrics
- **AWS X-Ray**: Distributed tracing (optional)

## 🔒 Security

### Security Features

- JWT authentication with token rotation
- Role-based access control
- Input validation and sanitization
- Rate limiting
- Security headers
- HTTPS enforcement
- Database encryption
- Secrets management

### Security Checklist

See [security-checklist.md](./security-checklist.md) for comprehensive security measures.

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Course Endpoints

- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course (Teacher/Admin)
- `PUT /api/courses/:id` - Update course (Teacher/Admin)
- `POST /api/courses/:id/lessons` - Add lesson to course

### Enrollment Endpoints

- `GET /api/enrollments` - Get user enrollments
- `POST /api/enrollments` - Enroll in course
- `DELETE /api/enrollments/:courseId` - Unenroll from course
- `GET /api/enrollments/:courseId/progress` - Get course progress

### Payment Endpoints

- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/create-checkout-session` - Create checkout session
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/payments/history` - Get payment history

## 🗄️ Database Schema

### Core Tables

- **users**: User accounts and profiles
- **courses**: Course information
- **lessons**: Individual lessons within courses
- **enrollments**: Student course enrollments
- **lesson_progress**: Student progress tracking
- **quizzes**: Quiz definitions
- **quiz_responses**: Student quiz answers
- **payments**: Payment records
- **notifications**: System notifications

See [backend/prisma/schema.prisma](./backend/prisma/schema.prisma) for complete schema.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow conventional commit messages
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

1. **Database Connection Issues**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env
   - Run migrations: `npm run db:migrate`

2. **Redis Connection Issues**
   - Ensure Redis is running
   - Check REDIS_URL in .env

3. **Build Issues**
   - Clear node_modules and reinstall
   - Check Node.js version (18+)
   - Ensure all environment variables are set

### Getting Help

- Check the [Issues](https://github.com/your-repo/issues) page
- Review the [API Documentation](http://localhost:3001/api-docs)
- Contact the development team

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Core authentication and authorization
- [x] Course management system
- [x] Video streaming with signed URLs
- [x] Payment processing
- [x] Basic progress tracking

### Phase 2 (Next)
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Live streaming capabilities
- [ ] Advanced quiz types
- [ ] Discussion forums

### Phase 3 (Future)
- [ ] AI-powered content recommendations
- [ ] Multi-language support
- [ ] Advanced reporting
- [ ] Integration with external LMS
- [ ] White-label solutions

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - Frontend framework
- [Express](https://expressjs.com/) - Backend framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Stripe](https://stripe.com/) - Payment processing
- [AWS](https://aws.amazon.com/) - Cloud infrastructure

---

**Built with ❤️ for modern e-learning**