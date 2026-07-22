import OpenAI from 'openai';
import { config } from '../config/index.js';
import { query } from '../config/db.js';

const openai = config.openai.apiKey ? new OpenAI({ apiKey: config.openai.apiKey }) : null;

const SYSTEM_PROMPT = `You are VeriFi AI's AI financial coach. You help users with:
- Budgeting advice and tips
- Understanding their spending patterns
- Saving strategies
- Debt management
- Financial goal setting
Be concise, friendly, and actionable. If you don't have context about their finances, ask clarifying questions or suggest they link accounts and set budgets.`;

export const getChatCompletion = async (userId: string, userMessage: string, history: { role: string; content: string }[] = []) => {
  if (!openai) {
    return {
      message: 'AI coach is not configured. Set OPENAI_API_KEY in your environment to enable the financial coach.',
    };
  }

  const contextResult = await query(
    `SELECT b.category, b.amount, 
            (SELECT COALESCE(SUM(ABS(t.amount)), 0) FROM transactions t 
             JOIN bank_accounts ba ON ba.id = t.account_id 
             WHERE ba.user_id = $1 AND t.date >= date_trunc('month', CURRENT_DATE)::date 
             AND t.category = b.category AND t.amount < 0) as spent
     FROM budgets b WHERE b.user_id = $1`,
    [userId]
  );

  let context = '';
  if (contextResult.rows.length > 0) {
    context = 'User\'s current budgets and spending this month:\n' + contextResult.rows
      .map((r: { category: string; amount: string; spent: string }) => 
        `- ${r.category}: budget $${r.amount}, spent ~$${parseFloat(r.spent).toFixed(2)}`)
      .join('\n');
  } else {
    context = 'User has not set up budgets yet.';
  }

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n${context}` },
    ...history.slice(-6).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 500,
  });

  return {
    message: completion.choices[0]?.message?.content || 'Unable to generate response.',
  };
};
