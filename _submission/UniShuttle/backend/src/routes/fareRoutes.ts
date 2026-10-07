import { Router } from 'express';
import { getDriverFares, setFareStatus, getMyFare } from '../controllers/fareController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protect all routes
router.use(authenticate as any);

router.get('/driver', getDriverFares as any);
router.get('/me', getMyFare as any);
router.patch('/:studentId', setFareStatus as any);

export default router;
