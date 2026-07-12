import { Router } from 'express';
import * as reportsController from '../controllers/reports';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();
router.use(requireAuth);
router.get('/:type', reportsController.getReport);

export default router;
