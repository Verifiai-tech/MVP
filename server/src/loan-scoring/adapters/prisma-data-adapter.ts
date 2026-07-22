import { prisma } from '../../lib/prisma.js';
import type { IFinancialDataPort, FinancialData } from '../ports/data-port.js';
import type { FraudFlag } from '../domain/types.js';

export class PrismaFinancialDataAdapter implements IFinancialDataPort {
  async getFinancialData(userId: string): Promise<FinancialData> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [accounts, transactions, budgets, fraudSignals] = await Promise.all([
      prisma.account.findMany({
        where: { userId, isActive: true },
        select: { id: true, currentBalance: true },
      }),
      prisma.transaction.findMany({
        where: { account: { userId } },
        select: { amount: true, date: true },
        orderBy: { date: 'asc' },
      }),
      prisma.budget.findMany({
        where: {
          userId,
          startDate: { lte: new Date() },
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
        select: { category: true, amount: true },
      }),
      prisma.fraudSignal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const totalBalance = accounts.reduce((s, a) => s + Number(a.currentBalance), 0);
    const tx90 = transactions.filter((t) => t.date >= ninetyDaysAgo);
    const transactionCount90d = tx90.length;
    const totalSpend90d = tx90.filter((t) => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const totalCredits90d = tx90.filter((t) => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);

    const monthlyCredits: number[] = [];
    const monthlyDebits: number[] = [];
    for (let i = 2; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const monthTx = tx90.filter((t) => t.date >= start && t.date < end);
      monthlyCredits.push(monthTx.filter((t) => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0));
      monthlyDebits.push(monthTx.filter((t) => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0));
    }

    const overdraftCount = 0;
    const negativeBalanceDays = totalBalance < 0 ? 30 : 0;

    let budgetAdherencePct = 0;
    if (budgets.length > 0) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const monthSpend = tx90.filter((t) => t.date >= startOfMonth && Number(t.amount) < 0);
      let underBudget = 0;
      for (const b of budgets) {
        const spent = monthSpend.reduce((s, t) => s + Math.abs(Number(t.amount)), 0) / budgets.length;
        if (spent <= Number(b.amount)) underBudget++;
      }
      budgetAdherencePct = Math.round((underBudget / budgets.length) * 100);
    }

    const fraudFlags: FraudFlag[] = fraudSignals.map((f) => ({
      code: f.signalType,
      severity: f.severity as FraudFlag['severity'],
      description: f.description ?? undefined,
    }));

    return {
      totalBalance,
      transactionCount90d,
      totalSpend90d,
      totalCredits90d,
      monthlyCredits,
      monthlyDebits,
      overdraftCount,
      negativeBalanceDays,
      budgetCount: budgets.length,
      budgetAdherencePct,
      fraudFlags,
    };
  }
}
