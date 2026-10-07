import { Router } from 'express';
import {
  getDrivers, updateDriverStatus, getStudentsByDriver, getPayments,
  createDriver, deleteDriver, getStudents, createStudent, deleteStudent,
  createPayout, getPayouts
} from '../controllers/adminController';
import { getPayoutRequests, reviewPayoutRequest } from '../controllers/payoutRequestController';
import { getContactMessages, markMessageRead, deleteContactMessage } from '../controllers/contactController';
import { authenticate, authorizeRole } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// Admin-only: a valid JWT with the ADMIN role is required for everything here.
router.use(authenticate as any);
router.use(authorizeRole([Role.ADMIN]) as any);

router.get('/drivers', getDrivers as any);
router.post('/drivers', createDriver as any);
router.patch('/drivers/:id/status', updateDriverStatus as any);
router.delete('/drivers/:id', deleteDriver as any);
router.get('/drivers/:id/students', getStudentsByDriver as any);

router.get('/students', getStudents as any);
router.post('/students', createStudent as any);
router.delete('/students/:id', deleteStudent as any);

router.get('/payments', getPayments as any);

router.get('/payouts', getPayouts as any);
router.post('/payouts', createPayout as any);

router.get('/payout-requests', getPayoutRequests as any);
router.patch('/payout-requests/:id', reviewPayoutRequest as any);

router.get('/messages', getContactMessages as any);
router.patch('/messages/:id/read', markMessageRead as any);
router.delete('/messages/:id', deleteContactMessage as any);

export default router;
