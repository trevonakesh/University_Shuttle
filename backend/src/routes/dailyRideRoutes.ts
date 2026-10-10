import { Router } from 'express';
import { createDailyRideRequest, getStudentDailyRequests, getDriverDailyRequests, updateDailyRideStatus, payDailyRide } from '../controllers/dailyRideController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protect all routes
router.use(authenticate as any);

router.post('/', createDailyRideRequest as any);
router.get('/student', getStudentDailyRequests as any);
router.get('/driver', getDriverDailyRequests as any);
router.patch('/:id/status', updateDailyRideStatus as any);
router.post('/:id/pay', payDailyRide as any);

export default router;
