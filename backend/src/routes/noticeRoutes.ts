import { Router } from 'express';
import { createNotice, getDriverNotices, getStudentNotices, deleteNotice } from '../controllers/noticeController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protect all routes
router.use(authenticate as any);

router.post('/', createNotice as any);
router.get('/driver', getDriverNotices as any);
router.get('/student', getStudentNotices as any);
router.delete('/:id', deleteNotice as any);

export default router;
