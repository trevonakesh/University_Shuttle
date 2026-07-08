import { Router } from 'express';
import { createPoll, getDriverPolls, getStudentPolls, votePoll, deletePoll } from '../controllers/pollController';
import { authenticate } from '../middleware/authMiddleware';
import { freezeGuard } from '../middleware/freezeGuard';

const router = Router();

// Protect all routes
router.use(authenticate as any);

router.post('/', createPoll as any);
router.get('/driver', getDriverPolls as any);
router.get('/student', getStudentPolls as any);
router.post('/:id/vote', freezeGuard as any, votePoll as any);
router.delete('/:id', deletePoll as any);

export default router;
