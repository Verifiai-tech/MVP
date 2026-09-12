import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from './prisma.js';

/** Database money fields are integer cents. APIs and the scoring model speak dollars. */

/** Above this, a cent amount is an extra ×100 from a dropped conversion marker. */
const SANE_MAX_CENTS = 10_000_000n;

const MONEY_COLUMNS: Array<{ table: string; column: string }> = [
  { table: 'Account', column: 'current_balance' },
  { table: 'Transaction', column: 'amount' },
  { table: 'Budget', column: 'amount' },
  { table: 'savings_goals', column: 'target_amount' },
  { table: 'savings_goals', column: 'current_amount' },
  { table: 'CategorizationFeedback', column: 'amount' },
  { table: 'LoanEligibilityResult', column: 'recommended_limit' },
  { table: 'Loan', column: 'amount' },
  { table: 'Loan', column: 'monthly_payment' },
];

export function dollarsToCents(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error('Invalid money amount');
  }
  return Math.round(value * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

function sqliteFile(): string | null {
  const url = process.env.DATABASE_URL ?? 'file:./dev.db';
  if (!url.startsWith('file:')) return null;
  const raw = url.slice('file:'.length).replace(/^\/\//, '');
  if (!raw || raw === ':memory:') return null;
  if (path.isAbsolute(raw)) return raw;
  const schemaDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../prisma');
  return path.resolve(schemaDir, raw);
}

function shrinkCents(value: bigint): bigint {
  let amount = value;
  const negative = amount < 0n;
  if (negative) amount = -amount;
  while (amount >= SANE_MAX_CENTS && amount % 100n === 0n) amount /= 100n;
  return negative ? -amount : amount;
}

/** Undo repeated ×100 conversions that pushed cent values past a sensible size. */
function repairInflatedCents(): void {
  const file = sqliteFile();
  if (!file) return;
  const db = new DatabaseSync(file);
  try {
    for (const { table, column } of MONEY_COLUMNS) {
      const rows = db.prepare(`SELECT "id", "${column}" AS value FROM "${table}"`).all() as Array<{
        id: string;
        value: number | bigint | null;
      }>;
      const update = db.prepare(`UPDATE "${table}" SET "${column}" = ? WHERE "id" = ?`);
      for (const row of rows) {
        if (row.value == null) continue;
        const current = BigInt(row.value);
        const next = shrinkCents(current);
        if (next !== current) update.run(Number(next), row.id);
      }
    }
  } finally {
    db.close();
  }
}

/**
 * Legacy databases stored dollars. Whole-number cent values are left alone,
 * so a missing marker cannot multiply them again on the next start.
 */
export async function ensureMoneyStoredAsCents(): Promise<void> {
  repairInflatedCents();

  const marker = await prisma.appMeta.findUnique({ where: { key: 'money_unit' } });
  if (marker?.value === 'cents') return;

  const updates = [
    'UPDATE "Account" SET "current_balance" = ROUND("current_balance" * 100) WHERE "current_balance" != ROUND("current_balance")',
    'UPDATE "Transaction" SET "amount" = ROUND("amount" * 100) WHERE "amount" != ROUND("amount")',
    'UPDATE "Budget" SET "amount" = ROUND("amount" * 100) WHERE "amount" != ROUND("amount")',
    'UPDATE "savings_goals" SET "target_amount" = ROUND("target_amount" * 100) WHERE "target_amount" != ROUND("target_amount")',
    'UPDATE "savings_goals" SET "current_amount" = ROUND("current_amount" * 100) WHERE "current_amount" != ROUND("current_amount")',
    'UPDATE "CategorizationFeedback" SET "amount" = ROUND("amount" * 100) WHERE "amount" != ROUND("amount")',
    'UPDATE "LoanEligibilityResult" SET "recommended_limit" = ROUND("recommended_limit" * 100) WHERE "recommended_limit" IS NOT NULL AND "recommended_limit" != ROUND("recommended_limit")',
    'UPDATE "Loan" SET "amount" = ROUND("amount" * 100) WHERE "amount" != ROUND("amount")',
    'UPDATE "Loan" SET "monthly_payment" = ROUND("monthly_payment" * 100) WHERE "monthly_payment" != ROUND("monthly_payment")',
  ];
  for (const sql of updates) {
    await prisma.$executeRawUnsafe(sql);
  }
  await prisma.appMeta.upsert({
    where: { key: 'money_unit' },
    create: { key: 'money_unit', value: 'cents' },
    update: { value: 'cents' },
  });
}
