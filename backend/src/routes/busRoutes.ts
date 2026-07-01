import { Router } from 'express';
import { getBuses, getBusById } from '../controllers/busController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protect all bus routes to ensure only logged-in users can view buses
router.use(authenticate as any);

router.get('/', getBuses as any);
router.get('/:id', getBusById as any);

export default router;
