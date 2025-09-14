# Deployment Guide

This guide covers deploying the e-learning platform to production environments.

## 📋 Prerequisites

- AWS Account with appropriate permissions
- Domain name (optional but recommended)
- GitHub repository with Actions enabled
- Vercel account for frontend hosting
- Stripe account for payments

## 🏗️ Infrastructure Setup

### 1. AWS Infrastructure with Terraform

1. **Install Terraform**
   ```bash
   # macOS
   brew install terraform
   
   # Ubuntu
   wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg
   echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
   sudo apt update && sudo apt install terraform
   ```

2. **Configure AWS CLI**
   ```bash
   aws configure
   # Enter your AWS Access Key ID, Secret Access Key, and default region
   ```

3. **Create S3 Bucket for Terraform State**
   ```bash
   aws s3 mb s3://elearning-terraform-state-YOUR-RANDOM-SUFFIX
   aws dynamodb create-table \
     --table-name terraform-state-lock \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1
   ```

4. **Update Terraform Backend Configuration**
   ```hcl
   # infrastructure/terraform/main.tf
   terraform {
     backend "s3" {
       bucket = "elearning-terraform-state-YOUR-RANDOM-SUFFIX"
       key    = "terraform.tfstate"
       region = "us-east-1"
       dynamodb_table = "terraform-state-lock"
       encrypt        = true
     }
   }
   ```

5. **Configure Terraform Variables**
   ```bash
   cd infrastructure/terraform
   cp terraform.tfvars.example terraform.tfvars
   ```
   
   Edit `terraform.tfvars`:
   ```hcl
   aws_region = "us-east-1"
   environment = "production"
   project_name = "elearning"
   
   # Domain Configuration
   domain_name = "yourdomain.com"
   api_subdomain = "api"
   
   # Database Configuration
   db_instance_class = "db.t3.small"
   db_allocated_storage = 20
   
   # ECS Configuration
   backend_cpu = 1024
   backend_memory = 2048
   backend_desired_count = 2
   
   # Alert Configuration
   alert_email = "alerts@yourdomain.com"
   ```

6. **Deploy Infrastructure**
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

   This will create:
   - VPC with public/private subnets
   - RDS PostgreSQL database
   - ElastiCache Redis cluster
   - ECS Fargate cluster
   - Application Load Balancer
   - S3 bucket with CloudFront
   - CloudWatch monitoring
   - WAF for security

### 2. Domain and SSL Setup

1. **Route 53 Hosted Zone** (if using AWS for DNS)
   ```bash
   aws route53 create-hosted-zone --name yourdomain.com --caller-reference $(date +%s)
   ```

2. **SSL Certificate**
   The Terraform configuration will create an ACM certificate automatically if you provide a domain name.

## 🔧 Application Configuration

### 1. GitHub Secrets

Configure the following secrets in your GitHub repository:

**AWS Secrets**
- `AWS_ACCESS_KEY_ID`: AWS access key for deployment
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for deployment
- `AWS_REGION`: AWS region (e.g., us-east-1)

**Database Secrets**
- `DATABASE_URL`: PostgreSQL connection string from Terraform output
- `REDIS_URL`: Redis connection string from Terraform output

**Application Secrets**
- `JWT_SECRET`: Random 64-character string
- `JWT_REFRESH_SECRET`: Random 64-character string
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret

**Email Secrets**
- `SMTP_HOST`: SMTP server host
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `FROM_EMAIL`: From email address

**Frontend Secrets**
- `VITE_API_URL`: Backend API URL (from ALB output)
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key

**Vercel Secrets**
- `VERCEL_TOKEN`: Vercel deployment token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

### 2. Vercel Project Setup

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Link Project**
   ```bash
   cd frontend
   vercel link
   ```

3. **Configure Environment Variables in Vercel**
   ```bash
   vercel env add VITE_API_URL
   vercel env add VITE_STRIPE_PUBLISHABLE_KEY
   ```

## 🚀 Deployment Process

### Automatic Deployment (Recommended)

1. **Push to Main Branch**
   ```bash
   git push origin main
   ```

2. **Monitor GitHub Actions**
   - Check the Actions tab in your GitHub repository
   - CI pipeline will run tests and build Docker images
   - CD pipeline will deploy to AWS ECS and Vercel

### Manual Deployment

#### Backend Deployment

1. **Build and Push Docker Image**
   ```bash
   # Get ECR repository URL from Terraform output
   ECR_REPO=$(terraform output -raw ecr_repository_url)
   
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REPO
   
   # Build and push
   cd backend
   docker build -t elearning-backend .
   docker tag elearning-backend:latest $ECR_REPO:latest
   docker push $ECR_REPO:latest
   ```

2. **Update ECS Service**
   ```bash
   aws ecs update-service \
     --cluster elearning-production-cluster \
     --service elearning-production-backend-service \
     --force-new-deployment
   ```

3. **Run Database Migrations**
   ```bash
   # Get task ARN
   TASK_ARN=$(aws ecs list-tasks --cluster elearning-production-cluster --service elearning-production-backend-service --query 'taskArns[0]' --output text)
   
   # Run migrations
   aws ecs execute-command \
     --cluster elearning-production-cluster \
     --task $TASK_ARN \
     --container elearning-backend \
     --command "npx prisma migrate deploy" \
     --interactive
   ```

#### Frontend Deployment

1. **Deploy to Vercel**
   ```bash
   cd frontend
   vercel --prod
   ```

## 🔍 Post-Deployment Verification

### 1. Health Checks

```bash
# Backend health check
curl https://api.yourdomain.com/health

# Frontend health check
curl https://yourdomain.com

# Database connectivity
aws ecs execute-command \
  --cluster elearning-production-cluster \
  --task $TASK_ARN \
  --container elearning-backend \
  --command "npx prisma db pull" \
  --interactive
```

### 2. Monitoring Setup

1. **CloudWatch Dashboards**
   - Visit AWS CloudWatch console
   - Check the created dashboard for metrics

2. **Alerts**
   - Verify SNS topic subscriptions
   - Test alert notifications

3. **Logs**
   - Check CloudWatch Logs for application logs
   - Verify log retention settings

### 3. Security Verification

```bash
# SSL certificate check
curl -I https://api.yourdomain.com

# Security headers check
curl -I https://yourdomain.com

# WAF verification (should block malicious requests)
curl -X POST https://yourdomain.com -d "'; DROP TABLE users; --"
```

## 🔧 Configuration Updates

### Environment Variables

To update environment variables in production:

1. **Update AWS Secrets Manager**
   ```bash
   aws secretsmanager update-secret \
     --secret-id elearning-production-jwt-secret \
     --secret-string "new-secret-value"
   ```

2. **Restart ECS Service**
   ```bash
   aws ecs update-service \
     --cluster elearning-production-cluster \
     --service elearning-production-backend-service \
     --force-new-deployment
   ```

3. **Update Vercel Environment Variables**
   ```bash
   vercel env rm VITE_API_URL production
   vercel env add VITE_API_URL production
   ```

### Database Migrations

```bash
# Create new migration
cd backend
npx prisma migrate dev --name migration_name

# Deploy to production
aws ecs execute-command \
  --cluster elearning-production-cluster \
  --task $TASK_ARN \
  --container elearning-backend \
  --command "npx prisma migrate deploy" \
  --interactive
```

## 🔄 Rollback Procedures

### Backend Rollback

1. **Rollback to Previous Task Definition**
   ```bash
   # List task definitions
   aws ecs list-task-definitions --family-prefix elearning-production-backend
   
   # Update service to previous version
   aws ecs update-service \
     --cluster elearning-production-cluster \
     --service elearning-production-backend-service \
     --task-definition elearning-production-backend:PREVIOUS_REVISION
   ```

2. **Database Rollback**
   ```bash
   # Rollback migration (if needed)
   aws ecs execute-command \
     --cluster elearning-production-cluster \
     --task $TASK_ARN \
     --container elearning-backend \
     --command "npx prisma migrate reset" \
     --interactive
   ```

### Frontend Rollback

```bash
# Rollback Vercel deployment
vercel rollback https://yourdomain.com
```

## 📊 Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_courses_published ON courses(is_published) WHERE is_published = true;
CREATE INDEX CONCURRENTLY idx_enrollments_user ON enrollments(user_id);
CREATE INDEX CONCURRENTLY idx_progress_user_course ON progress(user_id, course_id);
```

### 2. CDN Configuration

```bash
# Invalidate CloudFront cache after deployment
aws cloudfront create-invalidation \
  --distribution-id $(terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```

### 3. Auto Scaling Configuration

The Terraform configuration includes auto-scaling policies. Monitor and adjust thresholds:

```bash
# Update auto-scaling policies
aws application-autoscaling put-scaling-policy \
  --policy-name elearning-production-backend-cpu-scaling \
  --service-namespace ecs \
  --resource-id service/elearning-production-cluster/elearning-production-backend-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

## 🛡️ Security Hardening

### 1. WAF Rules

Update WAF rules based on traffic patterns:

```bash
# Add custom WAF rule
aws wafv2 update-web-acl \
  --scope CLOUDFRONT \
  --id $(terraform output -raw waf_web_acl_id) \
  --default-action Allow={} \
  --rules file://waf-rules.json
```

### 2. Security Groups

Regularly review and update security groups:

```bash
# List security groups
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=elearning-production-*"
```

## 📝 Maintenance Tasks

### Daily
- [ ] Check application health
- [ ] Review error logs
- [ ] Monitor performance metrics

### Weekly
- [ ] Update dependencies
- [ ] Review security alerts
- [ ] Check backup status
- [ ] Performance analysis

### Monthly
- [ ] Security audit
- [ ] Cost optimization review
- [ ] Capacity planning
- [ ] Disaster recovery testing

## 🆘 Troubleshooting

### Common Issues

**ECS Service Won't Start**
```bash
# Check service events
aws ecs describe-services \
  --cluster elearning-production-cluster \
  --services elearning-production-backend-service

# Check task logs
aws logs get-log-events \
  --log-group-name /ecs/elearning-production-backend \
  --log-stream-name ecs/elearning-backend/TASK_ID
```

**Database Connection Issues**
```bash
# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier elearning-production-database

# Test connectivity from ECS task
aws ecs execute-command \
  --cluster elearning-production-cluster \
  --task $TASK_ARN \
  --container elearning-backend \
  --command "nc -zv DATABASE_HOST 5432" \
  --interactive
```

**High Response Times**
```bash
# Check ALB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=LOAD_BALANCER_NAME \
  --start-time 2023-01-01T00:00:00Z \
  --end-time 2023-01-01T01:00:00Z \
  --period 300 \
  --statistics Average
```

For more troubleshooting scenarios, see [troubleshooting.md](../troubleshooting.md).

## 📞 Support

- **Infrastructure Issues**: infrastructure@elearning.com
- **Application Issues**: support@elearning.com
- **Security Issues**: security@elearning.com
- **Emergency**: +1-XXX-XXX-XXXX