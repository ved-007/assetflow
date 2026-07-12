import { Request, Response, NextFunction } from 'express';
import * as reportsService from '../services/reports';

export async function getReport(req: Request, res: Response, next: NextFunction) {
  try {
    const type = req.params.type;
    const data = await reportsService.getReport(type);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}
