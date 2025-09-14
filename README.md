## E-Learning Platform Monorepo

Production-ready e-learning web application.

### Stack
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express (TypeScript)
- Database: PostgreSQL (Prisma)
- Cache/Queue: Redis
- Storage/CDN: AWS S3 + CloudFront (signed URLs)
- Payments: Stripe Checkout + Webhooks
- Email: Nodemailer (SES)
- Deploy: Docker, GitHub Actions, AWS ECS Fargate (backend), Vercel (frontend)

### Repo Structure
```
backend/
frontend/
infra/terraform/
.github/workflows/
```

### Quickstart (Local Dev)
1. Copy env files and set values
```
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
2. Start services (Postgres, Redis)
```
docker compose up -d postgres redis
```
3. Install deps and generate Prisma client
```
cd backend && npm install && npx prisma generate && cd -
cd frontend && npm install && cd -
```
4. Run backend and frontend
```
cd backend && npm run dev
cd frontend && npm run dev
```

### Environment Variables
See `.env.example`, `backend/.env.example`, `frontend/.env.example` for required variables.

### CI/CD
- GitHub Actions: Lint, Test, Build; Deploy to ECS (backend) and Vercel (frontend)
- Requires repository secrets (see workflow file comments)

### Infrastructure
- Sample Terraform in `infra/terraform` for S3, RDS, ECS, CloudFront, IAM roles, CloudWatch

### Security
See `SECURITY_CHECKLIST.md` for hardening guidelines (OWASP, HTTPS, JWT rotation, rate limiting).

### License
MIT

# ANJIM-ARIF-RISVY
GOOD
