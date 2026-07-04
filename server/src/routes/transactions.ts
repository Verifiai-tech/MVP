import { Router } from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { accountId, startDate, endDate, category, limit = 50 } = req.query;
  let sql = `
    SELECT t.* FROM transactions t
    JOIN bank_accounts ba ON ba.id = t.account_id
    WHERE ba.user_id = $1
  `;
  const params: unknown[] = [req.user!.userId];
  let i = 2;

  if (accountId) {
    sql += ` AND t.account_id = $${i}`;
    params.push(accountId);
    i++;
  }
  if (startDate) {
    sql += ` AND t.date >= $${i}`;
    params.push(startDate);
    i++;
  }
  if (endDate) {
    sql += ` AND t.date <= $${i}`;
    params.push(endDate);
    i++;
  }
  if (category) {
    sql += ` AND t.category = $${i}`;
    params.push(category);
    i++;
  }

  sql += ` ORDER BY t.date DESC, t.created_at DESC LIMIT $${i}`;
  params.push(Math.min(parseInt(String(limit), 10) || 50, 200));

  const result = await query(sql, params);
  res.json(result.rows);
});

router.patch(
  '/:id',
  body('category').optional().trim(),
  body('notes').optional().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { category, notes } = req.body;
    const result = await query(
      `UPDATE transactions t
       SET category = COALESCE($2, t.category), subcategory = COALESCE($3, t.subcategory), notes = COALESCE($4, t.notes)
       FROM bank_accounts ba
       WHERE t.account_id = ba.id AND ba.user_id = $1 AND t.id = $5
       RETURNING t.*`,
      [req.user!.userId, category, category ? category.split(':')[1] : null, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json(result.rows[0]);
  }
);

export default router;
