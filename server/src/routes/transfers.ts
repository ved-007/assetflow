import { Router } from 'express';
import * as transfersController from '../controllers/transfers';
import { requireAuth } from '../middleware/requireAuth';
import { authorize } from '../middleware/authorize';

const router = Router();
router.use(requireAuth);

router.get('/', transfersController.listTransfers);
router.post('/', transfersController.requestTransfer);
router.post('/:id/decide', authorize(['ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD']), transfersController.decideTransfer);

export default router;
