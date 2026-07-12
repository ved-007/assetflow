import { Router } from 'express';
import * as notificationsController from '../controllers/notifications';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();
router.use(requireAuth);
router.get('/', notificationsController.listNotifications);
router.post('/read', notificationsController.markRead);
router.post('/read-all', notificationsController.markAllRead);

export default router;
