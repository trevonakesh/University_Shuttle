import { Router, Request, Response } from 'express';
import { getCommissionRate } from '../services/settingsService';

const router = Router();

// Public: the website shows the live commission rate instead of a hard-coded
// one. Only non-sensitive platform settings belong here.
router.get('/public', async (_req: Request, res: Response) => {
  try {
    const commissionRate = await getCommissionRate();
    res.status(200).json({ commissionRate });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
