import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const result = await query(
    'SELECT * FROM budgets WHERE user_id = $1 ORDER BY start_date DESC',
    [req.user!.userId]
  );
  res.json(result.rows);
});

router.post(
  '/',
  body('name').trim().notEmpty(),
  body('category').trim().notEmpty(),
  body('amount').isFloat({ min: 0 }),
  body('period').optional().isIn(['weekly', 'monthly', 'yearly']),
  body('startDate').isISO8601(),
  body('endDate').optional().isISO8601(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, category, amount, period = 'monthly', startDate, endDate } = req.body;
    const result = await query(
      `INSERT INTO budgets (user_id, name, category, amount, period, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user!.userId, name, category, amount, period, startDate, endDate || null]
    );
    res.status(201).json(result.rows[0]);
  }
);

router.put('/:id', async (req, res) => {
  const { name, amount, endDate } = req.body;
  const result = await query(
    `UPDATE budgets SET name = COALESCE($2, name), amount = COALESCE($3, amount), end_date = COALESCE($4, end_date)
     WHERE user_id = $1 AND id = $5
     RETURNING *`,
    [req.user!.userId, name, amount, endDate, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Budget not found' });
  res.json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  const result = await query('DELETE FROM budgets WHERE user_id = $1 AND id = $2 RETURNING id', [
    req.user!.userId,
    req.params.id,
  ]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Budget not found' });
  res.status(204).send();
});

export default router;
