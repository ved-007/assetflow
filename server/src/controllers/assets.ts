import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as assetsService from '../services/assets';

const listQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  location: z.string().optional(),
});

export async function listAssets(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listQuerySchema.parse(req.query);
    const data = await assetsService.listAssets(query);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

const registerSchema = z.object({
  name: z.string().min(1),
  categoryId: z.coerce.number(),
  serialNumber: z.string().optional(),
  acquisitionDate: z.string().optional(),
  acquisitionCost: z.coerce.number().optional(),
  condition: z.string().optional(),
  location: z.string().optional(),
  isBookable: z.coerce.boolean().optional(),
});

export async function registerAsset(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body);
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const asset = await assetsService.registerAsset(req.user!.id, { ...data, photoUrl });
    res.status(201).json({ ok: true, data: asset });
  } catch (err) {
    next(err);
  }
}

const editSchema = registerSchema.partial().extend({
  status: z.enum(['AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED']).optional()
});

export async function editAsset(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const data = editSchema.parse(req.body);
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const asset = await assetsService.editAsset(id, req.user!.id, { ...data, photoUrl });
    res.json({ ok: true, data: asset });
  } catch (err) {
    next(err);
  }
}

export async function getAsset(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const asset = await assetsService.getAsset(id);
    res.json({ ok: true, data: asset });
  } catch (err) {
    next(err);
  }
}
