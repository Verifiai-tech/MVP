import { Router } from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/monthly', async (req, res) => {
  const { month, year } = req.query;
  const m = month ? parseInt(String(month), 10) : new Date().getMonth() + 1;
  const y = year ? parseInt(String(year), 10) : new Date().getFullYear();
  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;

  const spendingResult = await query(
    `SELECT t.category, SUM(ABS(t.amount)) as total
     FROM transactions t
     JOIN bank_accounts ba ON ba.id = t.account_id
     WHERE ba.user_id = $1 AND t.amount < 0 AND t.date >= $2 AND t.date < $2::date + INTERVAL '1 month'
     GROUP BY t.category
     ORDER BY total DESC`,
    [req.user!.userId, startDate]
  );

  const budgetResult = await query(
    `SELECT category, amount, name FROM budgets WHERE user_id = $1`,
    [req.user!.userId]
  );
  const budgetMap = Object.fromEntries(budgetResult.rows.map((r: { category: string; amount: string; name: string }) => [r.category, { amount: parseFloat(r.amount), name: r.name }]));

  const insights = spendingResult.rows.map((r: { category: string; total: string }) => {
    const budget = budgetMap[r.category];
    const spent = parseFloat(r.total);
    return {
      category: r.category,
      spent,
      budget: budget?.amount ?? null,
      overBudget: budget ? spent > budget.amount : false,
      budgetName: budget?.name ?? null,
    };
  });

  const totalSpent = insights.reduce((sum, i) => sum + i.spent, 0);
  const totalBudgeted = Object.values(budgetMap).reduce((sum, b) => sum + b.amount, 0);

  res.json({
    month: m,
    year: y,
    totalSpent,
    totalBudgeted,
    byCategory: insights,
  });
});

export default router;
