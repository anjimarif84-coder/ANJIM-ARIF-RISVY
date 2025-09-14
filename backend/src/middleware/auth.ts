import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

export type JwtPayload = {
  sub: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  type: 'access' | 'refresh';
};

export function requireAuth(roles?: Array<JwtPayload['role']>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
    const token = auth.substring('Bearer '.length);
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'secret') as JwtPayload;
      if (decoded.type !== 'access') return res.status(401).json({ message: 'Unauthorized' });
      // @ts-expect-error attach user context
      req.user = { id: decoded.sub, role: decoded.role };
      if (roles && !roles.includes(decoded.role)) return res.status(403).json({ message: 'Forbidden' });
      return next();
    } catch {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
}

