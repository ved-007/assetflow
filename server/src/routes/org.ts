import { Router } from 'express';
import * as orgController from '../controllers/org';
import { requireAuth } from '../middleware/requireAuth';
import { authorize } from '../middleware/authorize';

const router = Router();
router.use(requireAuth);
router.use(authorize(['ADMIN']));

router.get('/departments', orgController.getDepartments);
router.post('/departments', orgController.createDepartment);
router.patch('/departments/:id', orgController.updateDepartment);

router.get('/categories', orgController.getCategories);
router.post('/categories', orgController.createCategory);
router.patch('/categories/:id', orgController.updateCategory);

router.get('/employees', orgController.getEmployees);
router.post('/employees/:id/role', orgController.updateEmployeeRole);

export default router;
