import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';

const MOCK_INSTITUTIONS = ['Chase', 'Bank of America', 'Wells Fargo', 'Citi', 'Capital One'];
const MOCK_MERCHANTS = ['Amazon', 'Starbucks', 'Walmart', 'Netflix', 'Spotify', 'Shell', 'Whole Foods', 'Uber', 'Target', 'Costco'];
const MOCK_CATEGORIES: Record<string, string[]> = {
  'Food and Drink': ['Restaurants', 'Groceries', 'Coffee'],
  'Travel': ['Airlines', 'Hotels', 'Gas'],
  'Entertainment': ['Streaming', 'Movies', 'Concerts'],
  'Shopping': ['Online', 'Department Stores'],
  'Bills': ['Utilities', 'Phone', 'Insurance'],
};

export const linkAccount = async (userId: string, institutionName?: string) => {
  const name = institutionName || MOCK_INSTITUTIONS[Math.floor(Math.random() * MOCK_INSTITUTIONS.length)];
  const result = await query(
    `INSERT INTO bank_accounts (user_id, plaid_account_id, institution_name, account_name, account_type, mask, current_balance)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, `mock_${uuidv4()}`, name, `${name} Checking`, 'checking', String(Math.floor(Math.random() * 9000) + 1000), Math.floor(Math.random() * 50000) / 100]
  );
  return result.rows[0];
};

export const getAccounts = async (userId: string) => {
  const result = await query(
    'SELECT * FROM bank_accounts WHERE user_id = $1 AND is_active = true ORDER BY linked_at DESC',
    [userId]
  );
  return result.rows;
};

export const syncTransactions = async (accountId: string, daysBack = 90) => {
  const categories = Object.entries(MOCK_CATEGORIES);
  const transactions: { amount: number; date: string; name: string; category: string }[] = [];
  const count = Math.floor(Math.random() * 20) + 10;

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * daysBack);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const [cat, subcats] = categories[Math.floor(Math.random() * categories.length)];
    const subcat = subcats[Math.floor(Math.random() * subcats.length)];
    const merchant = MOCK_MERCHANTS[Math.floor(Math.random() * MOCK_MERCHANTS.length)];
    const amount = -(Math.floor(Math.random() * 20000) + 100) / 100;
    transactions.push({
      amount,
      date: d.toISOString().split('T')[0],
      name: merchant,
      category: `${cat}:${subcat}`,
    });
  }

  for (const t of transactions) {
    const [cat, subcat] = t.category.split(':');
    await query(
      `INSERT INTO transactions (account_id, plaid_transaction_id, amount, date, name, merchant_name, category, subcategory)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (plaid_transaction_id) DO NOTHING`,
      [accountId, `mock_txn_${uuidv4()}`, t.amount, t.date, t.name, t.name, cat, subcat]
    );
  }

  return transactions.length;
};
