import { Router, Request, Response } from 'express';
import { getCommissionRate, getSignupForm, getSignupOptions } from '../services/settingsService';
import { onlinePaymentsEnabled } from '../services/payhere';

const router = Router();

// Public: the website shows the live commission rate instead of a hard-coded
// one. Only non-sensitive platform settings belong here.
router.get('/public', async (_req: Request, res: Response) => {
  try {
    const commissionRate = await getCommissionRate();
    res.status(200).json({ commissionRate, onlinePayments: onlinePaymentsEnabled() });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: the sign-up forms load their dropdown choices from here.
router.get('/signup-options', async (_req: Request, res: Response) => {
  try {
    res.status(200).json(await getSignupOptions());
  } catch (error) {
    console.error('Error fetching sign-up options:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: everything the sign-up forms need, the dropdown choices plus which
// fields to leave out and which extra fields to show.
router.get('/signup-form', async (_req: Request, res: Response) => {
  try {
    const [options, form] = await Promise.all([getSignupOptions(), getSignupForm()]);
    res.status(200).json({ options, ...form });
  } catch (error) {
    console.error('Error fetching sign-up form:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
