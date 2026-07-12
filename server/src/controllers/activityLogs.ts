import { Request, Response, NextFunction } from 'express';
import * as activityLogsService from '../services/activityLogs';

export async function listLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await activityLogsService.listLogs(req.query);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}
