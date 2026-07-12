import { Router } from 'express';
import * as orgController from '../controllers/org';
import { requireAuth } from '../middleware/requireAuth';
import { authorize } from '../middleware/authorize';

const router = Router();
router.use(requireAuth);

// Reference-data reads are needed across workflows (allocate, register asset, etc.)
// by any authenticated role; only mutations are Admin-only.
router.get('/departments', orgController.getDepartments);
router.get('/categories', orgController.getCategories);
router.get('/employees', orgController.getEmployees);

router.post('/departments', authorize(['ADMIN']), orgController.createDepartment);
router.patch('/departments/:id', authorize(['ADMIN']), orgController.updateDepartment);

router.post('/categories', authorize(['ADMIN']), orgController.createCategory);
router.patch('/categories/:id', authorize(['ADMIN']), orgController.updateCategory);

router.post('/employees/:id/role', authorize(['ADMIN']), orgController.updateEmployeeRole);

export default router;
