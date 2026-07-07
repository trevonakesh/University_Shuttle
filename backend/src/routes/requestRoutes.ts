import { Router } from 'express';
import { createRequest, getStudentRequests, getDriverRequests, updateRequestStatus, deleteRequest } from '../controllers/requestController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protect all routes
router.use(authenticate as any);

router.post('/', createRequest as any);
router.get('/student', getStudentRequests as any);
router.get('/driver', getDriverRequests as any);
router.patch('/:id', updateRequestStatus as any);
router.delete('/:id', deleteRequest as any);

export default router;
