import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard';

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getDashboardKPIs();
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}
