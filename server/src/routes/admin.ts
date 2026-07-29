import { Router } from 'express';
import { query } from '../config/db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.use(requireAdmin);

router.get('/users', async (_req, res) => {
  const result = await query(
    'SELECT id, email, first_name, last_name, role, is_active, created_at FROM users ORDER BY created_at DESC'
  );
  res.json(result.rows);
});

router.get('/audit-logs', async (req, res) => {
  const { userId, limit = 100 } = req.query;
  let sql = `
    SELECT al.*, u.email as user_email
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.user_id
    WHERE 1=1
  `;
  const params: unknown[] = [];
  let i = 1;
  if (userId) {
    sql += ` AND al.user_id = $${i}`;
    params.push(userId);
    i++;
  }
  sql += ` ORDER BY al.created_at DESC LIMIT $${i}`;
  params.push(Math.min(parseInt(String(limit), 10) || 100, 500));

  const result = await query(sql, params);
  res.json(result.rows);
});

export default router;
