import { Router } from 'express';
import * as maintenanceController from '../controllers/maintenance';
import { requireAuth } from '../middleware/requireAuth';
import { authorize } from '../middleware/authorize';
import { upload } from '../lib/upload';

const router = Router();
router.use(requireAuth);

router.get('/', maintenanceController.listMaintenance);
router.post('/', upload.single('photo'), maintenanceController.raiseMaintenance);
router.post('/:id/decide', authorize(['ADMIN', 'ASSET_MANAGER']), maintenanceController.decideMaintenance);
router.post('/:id/technician', authorize(['ADMIN', 'ASSET_MANAGER']), maintenanceController.assignTechnician);
router.post('/:id/status', authorize(['ADMIN', 'ASSET_MANAGER']), maintenanceController.updateStatus);

export default router;
