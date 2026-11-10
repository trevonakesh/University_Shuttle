import { Router } from 'express';
import { createRequest, getStudentRequests, getDriverRequests, updateRequestStatus, deleteRequest, getPassengerDetails, updatePassengerDetails } from '../controllers/requestController';
import { authenticate } from '../middleware/authMiddleware';
import { freezeGuard } from '../middleware/freezeGuard';

const router = Router();

// Protect all routes
router.use(authenticate as any);

router.post('/', freezeGuard as any, createRequest as any);
router.get('/student', getStudentRequests as any);
router.get('/driver', getDriverRequests as any);
router.get('/passengers/:studentId', getPassengerDetails as any);
router.patch('/passengers/:studentId', updatePassengerDetails as any);
router.patch('/:id', updateRequestStatus as any);
router.delete('/:id', deleteRequest as any);

export default router;
