import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { getChatCompletion } from '../services/openaiService.js';

const router = Router();
router.use(authenticate);

router.post(
  '/',
  body('message').trim().notEmpty(),
  body('history').optional().isArray(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { message, history = [] } = req.body;
    const response = await getChatCompletion(req.user!.userId, message, history);
    res.json(response);
  }
);

export default router;
