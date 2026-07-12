import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { AppError } from '../lib/AppError';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.token;
    if (!token) {
      throw new AppError(401, 'Unauthorized');
    }
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    next(new AppError(401, 'Unauthorized'));
  }
}
