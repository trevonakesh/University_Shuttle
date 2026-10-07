import { Router } from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protect all routes
router.use(authenticate as any);

router.get('/', getNotifications as any);
router.patch('/:id/read', markAsRead as any);

export default router;
