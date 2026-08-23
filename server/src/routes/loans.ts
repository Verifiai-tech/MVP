import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { calculateEligibilityScore, getLatestScore } from '../services/loanScoringService.js';

const router = Router();
router.use(authenticate);

router.get('/eligibility', async (req, res) => {
  const score = await getLatestScore(req.user!.userId);
  if (!score) return res.status(404).json({ error: 'No eligibility score yet. Link accounts and add transactions.' });
  res.json(score);
});

router.post('/eligibility', async (req, res) => {
  const result = await calculateEligibilityScore(req.user!.userId);
  res.json(result);
});

export default router;
