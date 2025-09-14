# Deployment Guide

## Overview

This guide covers deploying the E-Learning Platform to production using AWS infrastructure and automated CI/CD pipelines.

## Prerequisites

- AWS Account with appropriate permissions
- Terraform installed (>= 1.0)
- Docker installed
- GitHub repository with Actions enabled
- Domain name (optional)

## Infrastructure Setup

### 1. AWS Account Setup

1. Create an AWS account
2. Set up IAM user with programmatic access
3. Configure AWS CLI:
   ```bash
   aws configure
   ```

### 2. Terraform State Management

1. Create S3 bucket for Terraform state:
   ```bash
   aws s3 mb s3://elearning-terraform-state
   ```

2. Enable versioning:
   ```bash
   aws s3api put-bucket-versioning \
     --bucket elearning-terraform-state \
     --versioning-configuration Status=Enabled
   ```

### 3. Deploy Infrastructure

1. Navigate to infrastructure directory:
   ```bash
   cd infrastructure
   ```

2. Copy and configure variables:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

3. Initialize Terraform:
   ```bash
   terraform init
   ```

4. Plan deployment:
   ```bash
   terraform plan
   ```

5. Apply infrastructure:
   ```bash
   terraform apply
   ```

### 4. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

```
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
```

## Backend Deployment

### 1. ECR Repository Setup

1. Create ECR repository:
   ```bash
   aws ecr create-repository --repository-name elearning-backend
   ```

2. Get login token:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
   ```

### 2. Build and Push Image

1. Build Docker image:
   ```bash
   cd backend
   docker build -t elearning-backend .
   ```

2. Tag for ECR:
   ```bash
   docker tag elearning-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/elearning-backend:latest
   ```

3. Push to ECR:
   ```bash
   docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/elearning-backend:latest
   ```

### 3. ECS Service Configuration

The ECS service is automatically configured via Terraform. Key components:

- **Cluster**: Fargate cluster for serverless containers
- **Task Definition**: Defines container configuration
- **Service**: Manages running tasks
- **Load Balancer**: Routes traffic to healthy containers

### 4. Environment Variables

Set the following environment variables in ECS task definition:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/elearning
REDIS_URL=redis://elasticache-endpoint:6379
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
AWS_S3_BUCKET=your-s3-bucket
CLOUDFRONT_DOMAIN=your-cloudfront-domain
```

## Frontend Deployment

### 1. Vercel Setup

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Link project:
   ```bash
   cd frontend
   vercel link
   ```

### 2. Environment Variables

Set in Vercel dashboard:

```env
VITE_API_URL=https://api.yourdomain.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 3. Deploy

Deployment is automated via GitHub Actions on push to main branch.

## Database Setup

### 1. RDS Configuration

RDS PostgreSQL instance is created via Terraform with:

- Multi-AZ deployment for high availability
- Automated backups
- Encryption at rest
- Security groups restricting access

### 2. Database Initialization

1. Connect to RDS instance:
   ```bash
   psql -h your-rds-endpoint -U elearning_user -d elearning
   ```

2. Run migrations:
   ```bash
   cd backend
   npm run db:migrate
   ```

3. Seed initial data:
   ```bash
   npm run db:seed
   ```

## Redis Setup

### 1. ElastiCache Configuration

Redis cluster is configured via Terraform with:

- Multi-AZ deployment
- Encryption in transit and at rest
- Automatic failover
- Security groups

### 2. Connection

Redis is automatically accessible from ECS tasks via the configured security groups.

## File Storage Setup

### 1. S3 Bucket

S3 bucket is created via Terraform with:

- Versioning enabled
- Encryption at rest
- Public access blocked
- Lifecycle policies

### 2. CloudFront Distribution

CloudFront distribution is configured for:

- Global content delivery
- HTTPS enforcement
- Custom error pages
- Cache optimization

## Monitoring Setup

### 1. CloudWatch

- Application logs are sent to CloudWatch
- Custom metrics for business logic
- Alarms for critical thresholds

### 2. Sentry

Configure Sentry DSN in environment variables for error tracking.

## SSL/TLS Setup

### 1. Domain Configuration

1. Purchase domain from Route 53 or external provider
2. Create hosted zone in Route 53
3. Update nameservers

### 2. SSL Certificate

1. Request certificate in ACM:
   ```bash
   aws acm request-certificate \
     --domain-name yourdomain.com \
     --validation-method DNS
   ```

2. Validate certificate via DNS
3. Update load balancer listener to use HTTPS

## CI/CD Pipeline

### 1. GitHub Actions

The pipeline includes:

- **Testing**: Unit and integration tests
- **Security Scanning**: Vulnerability scanning
- **Building**: Docker image creation
- **Deployment**: Automated deployment to AWS
- **Monitoring**: Health checks and alerts

### 2. Pipeline Stages

1. **Pull Request**: Run tests and security scans
2. **Main Branch**: Deploy to staging
3. **Production**: Deploy to production with approval

## Health Checks

### 1. Application Health

- `/health` endpoint for basic health
- `/health/detailed` for comprehensive checks
- Database connectivity
- Redis connectivity
- External service availability

### 2. Infrastructure Health

- ECS service health
- Load balancer health
- RDS instance health
- ElastiCache health

## Backup Strategy

### 1. Database Backups

- Automated daily backups
- Point-in-time recovery
- Cross-region backup replication

### 2. Application Backups

- S3 versioning for file storage
- Infrastructure as code in Git
- Configuration backups

## Disaster Recovery

### 1. Multi-AZ Deployment

- RDS Multi-AZ
- ElastiCache Multi-AZ
- ECS tasks across availability zones

### 2. Backup Regions

- Cross-region RDS snapshots
- S3 cross-region replication
- Infrastructure templates for quick recovery

## Scaling

### 1. Auto Scaling

- ECS service auto scaling
- RDS read replicas
- ElastiCache cluster scaling

### 2. Performance Optimization

- CloudFront caching
- Database query optimization
- Application-level caching

## Security

### 1. Network Security

- VPC with private subnets
- Security groups
- Network ACLs
- WAF for load balancer

### 2. Access Control

- IAM roles and policies
- Secrets management
- Encryption at rest and in transit

## Troubleshooting

### Common Issues

1. **ECS Tasks Failing**
   - Check CloudWatch logs
   - Verify environment variables
   - Check security group rules

2. **Database Connection Issues**
   - Verify RDS security groups
   - Check connection string
   - Verify database credentials

3. **Load Balancer Issues**
   - Check target group health
   - Verify security groups
   - Check SSL certificate

### Debugging Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster elearning-cluster --services elearning-backend-service

# Check RDS instance status
aws rds describe-db-instances --db-instance-identifier elearning-db

# Check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix /ecs/elearning
```

## Maintenance

### 1. Regular Updates

- Keep dependencies updated
- Apply security patches
- Update infrastructure components

### 2. Monitoring

- Review CloudWatch metrics
- Check Sentry error reports
- Monitor performance trends

---

For additional support, refer to the main README or contact the development team.