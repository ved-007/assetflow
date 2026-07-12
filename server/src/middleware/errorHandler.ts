import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/AppError';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { prisma } from '../lib/prisma';

export async function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error Handler caught:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ ok: false, error: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({ ok: false, error: 'Validation failed', details: err.errors });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    if (err.meta?.target && String(err.meta.target).includes('uq_one_active_allocation')) {
      if (req.body.assetId) {
         try {
           const activeAlloc = await prisma.allocation.findFirst({
             where: { assetId: Number(req.body.assetId), returnedAt: null },
             include: { employee: true }
           });
           if (activeAlloc) {
              return res.status(409).json({ ok: false, error: `This asset is currently held by ${activeAlloc.employee.name}` });
           }
         } catch(e) {
         }
      }
      return res.status(409).json({ ok: false, error: 'This asset is currently allocated' });
    }
    
    return res.status(409).json({ ok: false, error: 'Unique constraint violation' });
  }

  return res.status(500).json({ ok: false, error: 'Internal server error' });
}
