import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function sanitizeUser(user: any) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const data = signupSchema.parse(req.body);
    const { token, user } = await authService.signup(data.name, data.email, data.password);
    res.cookie('token', token, cookieOptions);
    res.status(201).json({ ok: true, data: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const { token, user } = await authService.login(data.email, data.password);
    res.cookie('token', token, cookieOptions);
    res.status(200).json({ ok: true, data: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie('token', cookieOptions);
    res.status(200).json({ ok: true, data: null });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.id);
    res.status(200).json({ ok: true, data: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}
