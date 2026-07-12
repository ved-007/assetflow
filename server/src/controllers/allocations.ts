import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as allocationsService from '../services/allocations';

const listQuerySchema = z.object({
  tab: z.enum(['active', 'history']).optional().default('active'),
});

export async function listAllocations(req: Request, res: Response, next: NextFunction) {
  try {
    const { tab } = listQuerySchema.parse(req.query);
    const data = await allocationsService.listAllocations(tab);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

const allocateSchema = z.object({
  assetId: z.number(),
  employeeId: z.number(),
  expectedReturnDate: z.string().optional(),
});

export async function allocateAsset(req: Request, res: Response, next: NextFunction) {
  try {
    const data = allocateSchema.parse(req.body);
    const allocation = await allocationsService.allocateAsset(req.user!.id, data);
    res.status(201).json({ ok: true, data: allocation });
  } catch (err) {
    next(err);
  }
}

const returnSchema = z.object({
  condition: z.string().optional(),
  notes: z.string().optional(),
});

export async function returnAsset(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const data = returnSchema.parse(req.body);
    const allocation = await allocationsService.returnAsset(id, req.user!.id, data);
    res.json({ ok: true, data: allocation });
  } catch (err) {
    next(err);
  }
}
