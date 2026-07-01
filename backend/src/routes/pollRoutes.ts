import { Router } from 'express';
import { createPoll, getDriverPolls, getStudentPolls, votePoll } from '../controllers/pollController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protect all routes
router.use(authenticate as any);

router.post('/', createPoll as any);
router.get('/driver', getDriverPolls as any);
router.get('/student', getStudentPolls as any);
router.post('/:id/vote', votePoll as any);

export default router;
