import { Router } from 'express';
import {
  createPayoutRequest, getMyPayoutRequests, cancelPayoutRequest
} from '../controllers/payoutRequestController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Driver-facing endpoints (admin review lives under /api/admin).
router.use(authenticate as any);

router.post('/', createPayoutRequest as any);
router.get('/mine', getMyPayoutRequests as any);
router.delete('/:id', cancelPayoutRequest as any);

export default router;
