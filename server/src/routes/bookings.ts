import { Router } from 'express';
import * as bookingsController from '../controllers/bookings';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();
router.use(requireAuth);

router.get('/', bookingsController.listBookings);
router.post('/', bookingsController.createBooking);
router.post('/:id/cancel', bookingsController.cancelBooking);

export default router;
