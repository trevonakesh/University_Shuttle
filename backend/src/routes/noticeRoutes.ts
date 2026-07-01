import { Router } from 'express';
import { createNotice, getDriverNotices, getStudentNotices } from '../controllers/noticeController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protect all routes
router.use(authenticate as any);

router.post('/', createNotice as any);
router.get('/driver', getDriverNotices as any);
router.get('/student', getStudentNotices as any);

export default router;
