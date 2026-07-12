import { Router } from 'express';
import * as assetsController from '../controllers/assets';
import { requireAuth } from '../middleware/requireAuth';
import { authorize } from '../middleware/authorize';
import { upload } from '../lib/upload';

const router = Router();

router.use(requireAuth);

router.get('/', assetsController.listAssets);
router.post('/', authorize(['ADMIN', 'ASSET_MANAGER']), upload.single('photo'), assetsController.registerAsset);
router.patch('/:id', authorize(['ADMIN', 'ASSET_MANAGER']), upload.single('photo'), assetsController.editAsset);
router.get('/:id', assetsController.getAsset);

export default router;
