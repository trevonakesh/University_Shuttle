import { Router } from 'express';
import { getDrivers, updateDriverStatus, getStudentsByDriver, getPayments } from '../controllers/adminController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// In a real application, we would also have an requireAdmin middleware here
router.use(authenticate);

router.get('/drivers', getDrivers);
router.patch('/drivers/:id/status', updateDriverStatus);
router.get('/drivers/:id/students', getStudentsByDriver);
router.get('/payments', getPayments);

export default router;
