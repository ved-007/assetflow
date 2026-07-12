import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { authorize } from '../middleware/authorize';
import * as assetsController from '../controllers/assets';

const router = Router();

// GET /api/assets
router.get('/', requireAuth, assetsController.getAssets);

// POST /api/assets
router.post(
  '/',
  requireAuth,
  authorize(['ADMIN', 'ASSET_MANAGER']),
  assetsController.registerAsset
);

export default router;
