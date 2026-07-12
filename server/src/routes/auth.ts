import { Router } from 'express';
import * as authController from '../controllers/auth';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);

export default router;
