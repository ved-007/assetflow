import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();
router.use(requireAuth);
router.get('/', dashboardController.getDashboard);

export default router;
