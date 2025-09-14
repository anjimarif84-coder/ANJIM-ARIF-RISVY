## Security Checklist

- Authentication
  - Use JWT access (short TTL) + refresh tokens (httpOnly, secure, rotation)
  - Passwords hashed with Argon2id
  - Enforce strong password policy and email verification

- Authorization
  - Role-based (admin, teacher, student)
  - Check ownership on course/lesson/quiz operations

- API Hardening
  - Rate limit by IP and user (Redis store)
  - Input validation with zod/celebrate
  - Error handling without leaking internals
  - CORS restricted to known origins

- Data
  - Use parameterized queries via Prisma
  - Encrypt secrets via GitHub Actions secrets / AWS SSM

- Storage & Video
  - S3 private buckets; pre-signed upload URLs
  - CloudFront signed URLs for streaming

- Payments
  - Stripe webhook signature verification
  - Do not trust client amounts; compute server-side

- Transport
  - Enforce HTTPS everywhere
  - HSTS on CDN/domain

- Monitoring
  - Sentry DSN configured server/client
  - CloudWatch logs + alarms on 5xx & latency

- Deployment
  - Build-time secrets only from CI
  - ECS task roles least privilege

