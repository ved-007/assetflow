import { Router } from 'express';
import * as auditsController from '../controllers/audits';
import { requireAuth } from '../middleware/requireAuth';
import { authorize } from '../middleware/authorize';

const router = Router();
router.use(requireAuth);

router.get('/', auditsController.listAudits);
router.post('/', authorize(['ADMIN']), auditsController.createAuditCycle);
router.post('/:id/items/:itemId', auditsController.markAuditItem);
router.post('/:id/close', authorize(['ADMIN']), auditsController.closeAuditCycle);

export default router;
