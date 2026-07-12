import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as maintenanceService from '../services/maintenance';

const listQuerySchema = z.object({
  tab: z.enum(['all', 'mine']).optional().default('all'),
});

export async function listMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    const { tab } = listQuerySchema.parse(req.query);
    const data = await maintenanceService.listMaintenance(req.user!.id, tab);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

const raiseSchema = z.object({
  assetId: z.coerce.number(),
  description: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

export async function raiseMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = raiseSchema.parse(req.body);
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const request = await maintenanceService.raiseMaintenance(req.user!.id, { ...data, photoUrl });
    res.status(201).json({ ok: true, data: request });
  } catch (err) {
    next(err);
  }
}

const decideSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
});

export async function decideMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const { decision } = decideSchema.parse(req.body);
    const request = await maintenanceService.decideMaintenance(id, req.user!.id, decision);
    res.json({ ok: true, data: request });
  } catch (err) {
    next(err);
  }
}

const technicianSchema = z.object({
  technicianName: z.string().min(1),
});

export async function assignTechnician(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const { technicianName } = technicianSchema.parse(req.body);
    const request = await maintenanceService.assignTechnician(id, req.user!.id, technicianName);
    res.json({ ok: true, data: request });
  } catch (err) {
    next(err);
  }
}

const statusSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'RESOLVED']),
});

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = statusSchema.parse(req.body);
    const request = await maintenanceService.updateStatus(id, req.user!.id, status);
    res.json({ ok: true, data: request });
  } catch (err) {
    next(err);
  }
}
