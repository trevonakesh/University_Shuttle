import { Router } from 'express';
import {
  createPayment, getStudentPayments, getDriverPayments, getWalletBalance,
  initiatePayment, payhereCheckout, payhereNotify, payhereReturn, getPaymentStatus
} from '../controllers/paymentController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Public endpoints for the PayHere flow: the checkout page is opened in a
// plain browser (token-gated via query string) and notify/return are called
// by PayHere itself.
router.get('/checkout/:id', payhereCheckout as any);
router.post('/notify', payhereNotify as any);
router.get('/return', payhereReturn as any);

// Everything else requires a logged-in user.
router.use(authenticate as any);

router.post('/', createPayment as any);
router.post('/initiate', initiatePayment as any);
router.get('/student', getStudentPayments as any);
router.get('/driver', getDriverPayments as any);
router.get('/wallet', getWalletBalance as any);
router.get('/:id/status', getPaymentStatus as any);

export default router;
