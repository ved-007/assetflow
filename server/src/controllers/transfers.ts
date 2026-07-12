import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as transfersService from '../services/transfers';

export async function listTransfers(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await transfersService.listTransfers();
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

const requestSchema = z.object({
  assetId: z.number(),
  toEmployeeId: z.number(),
  reason: z.string().min(1),
});

export async function requestTransfer(req: Request, res: Response, next: NextFunction) {
  try {
    const data = requestSchema.parse(req.body);
    const transfer = await transfersService.requestTransfer(req.user!.id, data);
    res.status(201).json({ ok: true, data: transfer });
  } catch (err) {
    next(err);
  }
}

const decideSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
});

export async function decideTransfer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const { decision } = decideSchema.parse(req.body);
    const transfer = await transfersService.decideTransfer(id, req.user!.id, decision);
    res.json({ ok: true, data: transfer });
  } catch (err) {
    next(err);
  }
}
