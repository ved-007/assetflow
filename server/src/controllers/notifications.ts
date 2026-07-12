import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as notificationsService from '../services/notifications';

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await notificationsService.listNotifications(req.user!.id);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}

const readSchema = z.object({ id: z.number() });

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = readSchema.parse(req.body);
    const data = await notificationsService.markRead(req.user!.id, id);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await notificationsService.markAllRead(req.user!.id);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}
