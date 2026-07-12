import type { Request, Response, NextFunction } from 'express';
import type { JwtPayload } from '../lib/jwt';

export function authorize(roles: JwtPayload['role'][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ ok: false, error: 'You do not have permission to perform this action' });
      return;
    }
    next();
  };
}
