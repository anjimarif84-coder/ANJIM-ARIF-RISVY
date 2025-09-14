# ELearning Platform

A production-ready e-learning web application built with modern technologies and best practices.

## 🚀 Features

- **User Authentication**: JWT-based authentication with role-based access control (Admin, Teacher, Student)
- **Course Management**: Complete CRUD operations for courses, lessons, and quizzes
- **Video Streaming**: Secure video delivery with AWS S3 and CloudFront signed URLs
- **Payment Processing**: Integrated Stripe checkout with webhook handling
- **Progress Tracking**: Student enrollment and learning progress monitoring
- **Email Notifications**: Automated email notifications for key events
- **Security**: Comprehensive security measures following OWASP guidelines
- **Monitoring**: Full observability with logging, metrics, and alerting
- **Testing**: Complete test suite with unit and E2E tests
- **CI/CD**: Automated deployment pipeline with GitHub Actions

## 🏗️ Architecture

### Tech Stack

**Frontend**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Query for state management
- Zustand for client state
- React Hook Form for form handling

**Backend**
- Node.js with Express and TypeScript
- Prisma ORM with PostgreSQL
- Redis for caching and sessions
- JWT for authentication
- Stripe for payments
- AWS S3 for file storage
- Nodemailer for emails

**Infrastructure**
- Docker containers
- AWS ECS Fargate for backend
- Vercel for frontend hosting
- AWS RDS PostgreSQL
- AWS ElastiCache Redis
- AWS S3 + CloudFront CDN
- Terraform for IaC

**DevOps**
- GitHub Actions CI/CD
- Docker multi-stage builds
- Automated testing
- Security scanning
- Infrastructure as Code

## 📋 Prerequisites

- Node.js 18+
- Docker and Docker Compose
- AWS CLI (for deployment)
- Terraform (for infrastructure)
- Git

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/elearning-platform.git
   cd elearning-platform
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   cd backend
   npm run prisma:migrate
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database Admin: http://localhost:8080 (Adminer)
   - Redis Commander: http://localhost:8081

### Manual Setup (Development)

If you prefer to run services individually:

1. **Start PostgreSQL and Redis**
   ```bash
   docker-compose up -d postgres redis
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run prisma:generate
   npm run prisma:migrate
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/elearning_db"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# AWS
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="elearning-videos"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3001/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 📚 API Documentation

The API follows RESTful conventions with comprehensive OpenAPI documentation.

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/profile` - Get user profile

### Course Endpoints
- `GET /api/courses` - List courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (Teacher/Admin)
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Enrollment Endpoints
- `GET /api/enrollments/my` - Get user enrollments
- `POST /api/enrollments/:courseId` - Enroll in course

### Payment Endpoints
- `POST /api/payments/create-checkout-session` - Create Stripe session
- `POST /api/payments/webhook` - Stripe webhook handler

For complete API documentation, visit `/api/docs` when running the backend.

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                # Run unit tests
npm run test:coverage   # Run with coverage
npm run test:watch      # Watch mode
```

### Frontend Tests
```bash
cd frontend
npm test                # Run unit tests
npm run test:coverage   # Run with coverage
npm run cypress:open    # Open Cypress E2E tests
npm run cypress:run     # Run E2E tests headlessly
```

### Running All Tests
```bash
# From project root
npm run test:all
```

## 🚢 Deployment

### Production Deployment

1. **Infrastructure Setup**
   ```bash
   cd infrastructure/terraform
   terraform init
   terraform plan -var-file="terraform.tfvars"
   terraform apply
   ```

2. **Configure GitHub Secrets**
   Required secrets for GitHub Actions:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `DATABASE_URL`
   - `REDIS_URL`
   - `JWT_SECRET`
   - `STRIPE_SECRET_KEY`
   - `VERCEL_TOKEN`

3. **Deploy**
   Push to `main` branch to trigger automatic deployment via GitHub Actions.

### Manual Deployment

**Backend to AWS ECS**
```bash
# Build and push Docker image
docker build -t elearning-backend ./backend
docker tag elearning-backend:latest $ECR_REPO:latest
docker push $ECR_REPO:latest

# Update ECS service
aws ecs update-service --cluster elearning-cluster --service elearning-backend-service --force-new-deployment
```

**Frontend to Vercel**
```bash
cd frontend
vercel --prod
```

## 🔒 Security

This application implements comprehensive security measures:

- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control
- **Data Protection**: Encryption at rest and in transit
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: Protection against brute force attacks
- **Security Headers**: OWASP recommended headers
- **HTTPS**: Enforced across all environments
- **Monitoring**: Security event logging and alerting

See [Security Checklist](docs/security/SECURITY_CHECKLIST.md) for complete details.

## 📊 Monitoring

### Application Monitoring
- **Logging**: Structured logging with Winston
- **Metrics**: Custom metrics collection
- **Error Tracking**: Sentry integration
- **Health Checks**: Automated health monitoring

### Infrastructure Monitoring
- **AWS CloudWatch**: System metrics and logs
- **Alerts**: SNS notifications for critical events
- **Dashboards**: Real-time monitoring dashboards
- **Performance**: Response time and throughput tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write tests for new features
- Update documentation
- Follow conventional commits
- Ensure security best practices

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Open a GitHub issue for bugs or feature requests
- **Security**: Report security issues to security@elearning.com
- **Community**: Join our Discord server for discussions

## 🗺️ Roadmap

### Current Version (v1.0)
- ✅ Core authentication and authorization
- ✅ Course and lesson management
- ✅ Video streaming with S3
- ✅ Payment processing with Stripe
- ✅ Basic progress tracking

### Upcoming Features (v1.1)
- [ ] Real-time chat and discussions
- [ ] Advanced analytics dashboard
- [ ] Mobile app with React Native
- [ ] AI-powered course recommendations
- [ ] Multi-language support

### Future Enhancements (v2.0)
- [ ] Live streaming capabilities
- [ ] Gamification features
- [ ] Advanced quiz types
- [ ] Certificate generation
- [ ] Integration marketplace

## 📈 Performance

### Benchmarks
- **API Response Time**: < 200ms (95th percentile)
- **Page Load Time**: < 2s (First Contentful Paint)
- **Video Start Time**: < 3s
- **Database Queries**: Optimized with indexes and caching

### Scalability
- **Horizontal Scaling**: Auto-scaling ECS services
- **Database**: Read replicas for performance
- **CDN**: Global content delivery
- **Caching**: Redis for session and data caching

## 🔧 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Reset database
docker-compose down
docker-compose up -d postgres
npm run prisma:migrate
```

**Redis Connection Issues**
```bash
# Check Redis status
docker-compose ps redis

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

**Build Issues**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear Docker cache
docker system prune -a
```

For more troubleshooting guides, see [docs/troubleshooting.md](docs/troubleshooting.md).

---

**Built with ❤️ by the ELearning Team**