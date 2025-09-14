import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { PrismaClient } from '@prisma/client';
import { createRateLimiter } from './util/rateLimiter';
import { authRouter } from './routes/auth';
import { coursesRouter } from './routes/courses';
import { quizzesRouter } from './routes/quizzes';
import { paymentsRouter } from './routes/payments';

const app = express();
const prisma = new PrismaClient();

app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL?.split(',') || '*', credentials: true }));

const limiter = createRateLimiter();
app.use(limiter);

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// OpenAPI
const swaggerDocument = YAML.load(__dirname + '/../openapi.yml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/auth', authRouter(prisma));
app.use('/api/courses', coursesRouter(prisma));
app.use('/api/quizzes', quizzesRouter(prisma));
app.use('/api/payments', paymentsRouter(prisma));

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(err.status || 500).json({ message: 'Internal Server Error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on :${port}`);
});

export default app;

