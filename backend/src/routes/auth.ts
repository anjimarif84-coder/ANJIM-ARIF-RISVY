import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

export function authRouter(prisma: PrismaClient) {
  const router = Router();

  router.post('/signup', async (req, res) => {
    const parsed = credsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const { email, password, name } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Email already in use' });
    const passwordHash = await argon2.hash(password);
    const user = await prisma.user.create({ data: { email, passwordHash, name: name || email.split('@')[0], role: Role.STUDENT } });
    const tokens = issueTokens(user.id, user.role);
    return res.status(201).json({ user: { id: user.id, email: user.email, role: user.role, name: user.name }, ...tokens });
  });

  router.post('/login', async (req, res) => {
    const parsed = credsSchema.pick({ email: true, password: true }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    const tokens = issueTokens(user.id, user.role);
    return res.json({ user: { id: user.id, email: user.email, role: user.role, name: user.name }, ...tokens });
  });

  router.post('/refresh', async (req, res) => {
    const token = req.body?.refreshToken as string | undefined;
    if (!token) return res.status(400).json({ message: 'Missing refresh token' });
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'secret') as any;
      if (decoded.type !== 'refresh') throw new Error('invalid');
      const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      const tokens = issueTokens(user.id, user.role);
      return res.json(tokens);
    } catch {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  });

  return router;
}

function issueTokens(userId: string, role: Role) {
  const accessToken = jwt.sign({ sub: userId, role, type: 'access' }, process.env.JWT_ACCESS_SECRET || 'secret', {
    expiresIn: process.env.JWT_ACCESS_TTL || '15m',
  });
  const refreshToken = jwt.sign({ sub: userId, role, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || 'secret', {
    expiresIn: process.env.JWT_REFRESH_TTL || '7d',
  });
  return { accessToken, refreshToken };
}

