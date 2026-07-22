import { query } from '../config/db.js';

interface ScoreFactors {
  incomeStability?: number;
  savingsRate?: number;
  debtToIncome?: number;
  transactionHistory?: number;
  budgetAdherence?: number;
}

export const calculateEligibilityScore = async (userId: string): Promise<{ score: number; factors: ScoreFactors; recommendedLimit: number }> => {
  const accountsResult = await query(
    'SELECT COALESCE(SUM(current_balance), 0) as total_balance FROM bank_accounts WHERE user_id = $1 AND is_active = true',
    [userId]
  );
  const totalBalance = parseFloat(accountsResult.rows[0]?.total_balance || '0');

  const txnResult = await query(
    `SELECT COUNT(*) as count, COALESCE(SUM(ABS(amount)), 0) as total
     FROM transactions t
     JOIN bank_accounts ba ON ba.id = t.account_id
     WHERE ba.user_id = $1 AND t.date >= CURRENT_DATE - INTERVAL '90 days'`,
    [userId]
  );
  const txnCount = parseInt(txnResult.rows[0]?.count || '0', 10);
  const txnVolume = parseFloat(txnResult.rows[0]?.total || '0');

  const budgetResult = await query(
    `SELECT COUNT(*) as count FROM budgets WHERE user_id = $1`,
    [userId]
  );
  const budgetCount = parseInt(budgetResult.rows[0]?.count || '0', 10);

  const incomeStability = Math.min(100, txnCount * 2);
  const savingsRate = Math.min(100, Math.max(0, (totalBalance / (txnVolume / 3 || 1)) * 10));
  const debtToIncome = totalBalance >= 0 ? 80 : Math.max(0, 80 + totalBalance / 100);
  const transactionHistory = Math.min(100, txnCount * 3);
  const budgetAdherence = Math.min(100, budgetCount * 20 + 40);

  const score = Math.round(
    incomeStability * 0.2 + savingsRate * 0.25 + debtToIncome * 0.25 + transactionHistory * 0.2 + budgetAdherence * 0.1
  );
  const cappedScore = Math.max(0, Math.min(100, score));

  const recommendedLimit = Math.min(5000, Math.max(500, Math.round((cappedScore / 100) * 5000)));

  const factors: ScoreFactors = {
    incomeStability: Math.round(incomeStability),
    savingsRate: Math.round(savingsRate),
    debtToIncome: Math.round(debtToIncome),
    transactionHistory: Math.round(transactionHistory),
    budgetAdherence: Math.round(budgetAdherence),
  };

  await query(
    'INSERT INTO loan_eligibility (user_id, score, factors, recommended_limit) VALUES ($1, $2, $3, $4)',
    [userId, cappedScore, JSON.stringify(factors), recommendedLimit]
  );

  return { score: cappedScore, factors, recommendedLimit };
};

export const getLatestScore = async (userId: string) => {
  const result = await query(
    'SELECT * FROM loan_eligibility WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  return result.rows[0];
};
