import { Router } from 'express';
import * as allocationsController from '../controllers/allocations';
import { requireAuth } from '../middleware/requireAuth';
import { authorize } from '../middleware/authorize';

const router = Router();
router.use(requireAuth);

router.get('/', allocationsController.listAllocations);
router.post('/', authorize(['ADMIN', 'ASSET_MANAGER']), allocationsController.allocateAsset);
router.post('/:id/return', authorize(['ADMIN', 'ASSET_MANAGER']), allocationsController.returnAsset);

export default router;
