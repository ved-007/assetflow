import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as auditsService from '../services/audits';

export async function listAudits(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await auditsService.listAudits();
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  departmentId: z.number().optional(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  auditorIds: z.array(z.number()),
});

export async function createAuditCycle(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body);
    const cycle = await auditsService.createAuditCycle(req.user!.id, data);
    res.status(201).json({ ok: true, data: cycle });
  } catch (err) {
    next(err);
  }
}

const markSchema = z.object({
  result: z.enum(['VERIFIED', 'MISSING', 'DAMAGED']),
  notes: z.string().optional(),
});

export async function markAuditItem(req: Request, res: Response, next: NextFunction) {
  try {
    const cycleId = parseInt(req.params.id, 10);
    const itemId = parseInt(req.params.itemId, 10);
    const data = markSchema.parse(req.body);
    const item = await auditsService.markAuditItem(cycleId, itemId, req.user!.id, data);
    res.json({ ok: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function closeAuditCycle(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const cycle = await auditsService.closeAuditCycle(id, req.user!.id);
    res.json({ ok: true, data: cycle });
  } catch (err) {
    next(err);
  }
}
