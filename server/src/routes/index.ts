import { Router } from 'express';
import authRoutes from './auth';
import assetsRoutes from './assets';
import allocationsRoutes from './allocations';
import transfersRoutes from './transfers';
import bookingsRoutes from './bookings';
import maintenanceRoutes from './maintenance';
import auditsRoutes from './audits';
import orgRoutes from './org';
import dashboardRoutes from './dashboard';
import reportsRoutes from './reports';
import notificationsRoutes from './notifications';
import activityLogsRoutes from './activityLogs';

const router = Router();

router.use('/auth', authRoutes);
router.use('/assets', assetsRoutes);
router.use('/allocations', allocationsRoutes);
router.use('/transfers', transfersRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/audits', auditsRoutes);
router.use('/org', orgRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/activity-logs', activityLogsRoutes);

export default router;
