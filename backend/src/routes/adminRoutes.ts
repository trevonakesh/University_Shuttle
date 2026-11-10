import { Router } from 'express';
import {
  getDrivers, updateDriverStatus, getStudentsByDriver, getPayments,
  createDriver, deleteDriver, getStudents, createStudent, deleteStudent,
  createPayout, getPayouts,
  getCommissionRateHandler, updateCommissionRateHandler
} from '../controllers/adminController';
import {
  getDriverAccount, updateDriverAccount, getStudentAccount, updateStudentAccount, updateSignupOptions,
  getAdminSignupForm, updateSignupForm
} from '../controllers/adminAccountController';
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
router.get('/drivers/:id', getDriverAccount as any);
router.patch('/drivers/:id', updateDriverAccount as any);
router.patch('/drivers/:id/status', updateDriverStatus as any);
router.delete('/drivers/:id', deleteDriver as any);
router.get('/drivers/:id/students', getStudentsByDriver as any);

router.get('/students', getStudents as any);
router.post('/students', createStudent as any);
router.get('/students/:id', getStudentAccount as any);
router.patch('/students/:id', updateStudentAccount as any);
router.delete('/students/:id', deleteStudent as any);

router.get('/payments', getPayments as any);

router.get('/payouts', getPayouts as any);
router.post('/payouts', createPayout as any);

router.get('/payout-requests', getPayoutRequests as any);
router.patch('/payout-requests/:id', reviewPayoutRequest as any);

router.get('/messages', getContactMessages as any);
router.patch('/messages/:id/read', markMessageRead as any);
router.delete('/messages/:id', deleteContactMessage as any);

// Platform settings
router.get('/settings/commission', getCommissionRateHandler as any);
router.patch('/settings/commission', updateCommissionRateHandler as any);
router.patch('/settings/signup-options', updateSignupOptions as any);
router.get('/settings/signup-form', getAdminSignupForm as any);
router.patch('/settings/signup-form', updateSignupForm as any);

export default router;
