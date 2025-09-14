# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

# RDS Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

# ElastiCache Outputs
output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_replication_group.main.configuration_endpoint_address
  sensitive   = true
}

output "redis_port" {
  description = "ElastiCache Redis port"
  value       = aws_elasticache_replication_group.main.port
}

# S3 Outputs
output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.main.bucket
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.main.arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

# ALB Outputs
output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB zone ID"
  value       = aws_lb.main.zone_id
}

output "api_url" {
  description = "API URL"
  value       = var.domain_name != "" ? "https://${var.api_subdomain}.${var.domain_name}" : "https://${aws_lb.main.dns_name}"
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.backend.name
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

# Secrets Manager Outputs
output "database_secret_arn" {
  description = "Database secret ARN"
  value       = aws_secretsmanager_secret.database_url.arn
  sensitive   = true
}

output "redis_secret_arn" {
  description = "Redis secret ARN"
  value       = aws_secretsmanager_secret.redis_url.arn
  sensitive   = true
}

output "jwt_secret_arn" {
  description = "JWT secret ARN"
  value       = aws_secretsmanager_secret.jwt_secret.arn
  sensitive   = true
}

# Domain Outputs
output "certificate_arn" {
  description = "ACM certificate ARN"
  value       = var.certificate_arn != "" ? var.certificate_arn : (var.domain_name != "" ? aws_acm_certificate.main[0].arn : null)
}

# Environment Variables for Application
output "environment_variables" {
  description = "Environment variables for the application"
  value = {
    DATABASE_URL = "Use ${aws_secretsmanager_secret.database_url.name} from Secrets Manager"
    REDIS_URL    = "Use ${aws_secretsmanager_secret.redis_url.name} from Secrets Manager"
    JWT_SECRET   = "Use ${aws_secretsmanager_secret.jwt_secret.name} from Secrets Manager"
    AWS_REGION   = var.aws_region
    S3_BUCKET    = aws_s3_bucket.main.bucket
    CDN_DOMAIN   = aws_cloudfront_distribution.main.domain_name
  }
  sensitive = true
}