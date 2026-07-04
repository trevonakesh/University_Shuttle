import { Router } from 'express';
import { createPayment, getStudentPayments, getDriverPayments, getWalletBalance } from '../controllers/paymentController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protect all routes
router.use(authenticate as any);

router.post('/', createPayment as any);
router.get('/student', getStudentPayments as any);
router.get('/driver', getDriverPayments as any);
router.get('/wallet', getWalletBalance as any);

export default router;
