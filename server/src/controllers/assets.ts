import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as assetsService from '../services/assets';

const registerAssetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  category: z.string().min(1, 'Category is required'),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  condition: z.string().optional(),
  acquisitionDate: z.string().optional(),
  acquisitionCost: z.number().optional().or(z.string().transform(v => v === "" ? undefined : Number(v))).optional(),
  isBookable: z.boolean().default(false),
});

export async function getAssets(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query.q as string | undefined;
    const category = req.query.category as string | undefined;
    const status = req.query.status as string | undefined;
    const location = req.query.location as string | undefined;

    const assets = await assetsService.getAssets({ q, category, status, location });
    res.status(200).json({ ok: true, data: assets });
  } catch (err) {
    next(err);
  }
}

export async function registerAsset(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = registerAssetSchema.parse(req.body);
    const actorId = req.user!.id;

    const newAsset = await assetsService.registerAsset(actorId, {
      ...validatedData,
      serialNumber: validatedData.serialNumber ?? "",
      location: validatedData.location ?? "",
      condition: validatedData.condition ?? "GOOD",
    });

    res.status(201).json({ ok: true, data: newAsset });
  } catch (err) {
    next(err);
  }
}
