import { Router } from 'express';
import * as activityLogsController from '../controllers/activityLogs';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();
router.use(requireAuth);
router.get('/', activityLogsController.listLogs);

export default router;
