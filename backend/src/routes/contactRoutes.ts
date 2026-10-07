import { Router } from 'express';
import { createContactMessage } from '../controllers/contactController';

const router = Router();

// Public: the marketing site's contact form posts here.
router.post('/', createContactMessage as any);

export default router;
