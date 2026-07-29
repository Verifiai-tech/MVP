import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/monthly', async (req, res, next) => {
  try {
    const month = req.query.month ? parseInt(String(req.query.month), 10) : new Date().getMonth() + 1;
    const year = req.query.year ? parseInt(String(req.query.year), 10) : new Date().getFullYear();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const accounts = await prisma.account.findMany({
      where: { userId: req.user!.userId, isActive: true },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);
    if (accountIds.length === 0) {
      return res.json({
        month,
        year,
        totalSpent: 0,
        totalBudgeted: 0,
        byCategory: [],
        monthlyTrend: [],
      });
    }

    const [txs, budgets] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          accountId: { in: accountIds },
          date: { gte: start, lt: end },
          amount: { lt: 0 },
        },
        select: { category: true, amount: true },
      }),
      prisma.budget.findMany({
        where: {
          userId: req.user!.userId,
          startDate: { lte: end },
          OR: [{ endDate: null }, { endDate: { gte: start } }],
        },
        select: { category: true, amount: true, name: true },
      }),
    ]);

    const spendByCat: Record<string, number> = {};
    for (const t of txs) {
      const cat = t.category || 'Uncategorized';
      spendByCat[cat] = (spendByCat[cat] ?? 0) + Math.abs(Number(t.amount));
    }

    const budgetMap: Record<string, { amount: number; name: string }> = {};
    for (const b of budgets) {
      budgetMap[b.category] = { amount: Number(b.amount), name: b.name };
    }

    const byCategory = Object.entries(spendByCat)
      .map(([category, spent]) => ({
        category,
        spent,
        budget: budgetMap[category]?.amount ?? null,
        overBudget: budgetMap[category] ? spent > budgetMap[category].amount : false,
        budgetName: budgetMap[category]?.name ?? null,
      }))
      .sort((a, b) => b.spent - a.spent);

    const totalSpent = byCategory.reduce((s, c) => s + c.spent, 0);
    const totalBudgeted = Object.values(budgetMap).reduce((s, b) => s + b.amount, 0);

    const monthlyTrend = await getMonthlyTrend(accountIds, year, month);
    res.json({
      month,
      year,
      totalSpent,
      totalBudgeted,
      byCategory,
      monthlyTrend,
    });
  } catch (err) {
    next(err);
  }
});

async function getMonthlyTrend(accountIds: string[], year: number, month: number) {
  const result: { month: string; spent: number; credits: number }[] = [];
  for (let i = 2; i >= 0; i--) {
    const m = month - i;
    let y = year;
    let mo = m;
    if (m < 1) {
      mo = m + 12;
      y -= 1;
    } else if (m > 12) {
      mo = m - 12;
      y += 1;
    }
    const start = new Date(y, mo - 1, 1);
    const end = new Date(y, mo, 1);
    const txs = await prisma.transaction.findMany({
      where: {
        accountId: { in: accountIds },
        date: { gte: start, lt: end },
      },
      select: { amount: true },
    });
    const spent = txs.filter((t) => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const credits = txs.filter((t) => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);
    result.push({
      month: new Date(y, mo - 1).toLocaleString('en-US', { month: 'short' }),
      spent: Math.round(spent * 100) / 100,
      credits: Math.round(credits * 100) / 100,
    });
  }
  return result;
}

export default router;
