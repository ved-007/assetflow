import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as bookingsService from '../services/bookings';

const listQuerySchema = z.object({
  assetId: z.coerce.number().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function listBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listQuerySchema.parse(req.query);
    const data = await bookingsService.listBookings(query);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

const createSchema = z.object({
  assetId: z.number(),
  startTime: z.string(),
  endTime: z.string(),
  purpose: z.string().min(1),
});

export async function createBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body);
    const booking = await bookingsService.createBooking(req.user!.id, data);
    res.status(201).json({ ok: true, data: booking });
  } catch (err) {
    next(err);
  }
}

export async function cancelBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const booking = await bookingsService.cancelBooking(id, req.user!.id);
    res.json({ ok: true, data: booking });
  } catch (err) {
    next(err);
  }
}
