import { Router } from 'express';
import { registerStudent, registerDriver, login, getMe, forgotPassword, resetPassword } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/register/student', registerStudent);
router.post('/register/driver', registerDriver);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Example protected route for verification
router.get('/me', authenticate, getMe);

export default router;
