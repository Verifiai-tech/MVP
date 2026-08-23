import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';
import { linkAccount, getAccounts, syncTransactions } from '../services/plaidMockService.js';

const router = Router();
router.use(authenticate);
router.use(auditLog('view_accounts', 'accounts'));

router.get('/', async (req, res) => {
  const accounts = await getAccounts(req.user!.userId);
  res.json(accounts);
});

router.post('/link', auditLog('link_account', 'account'), async (req, res) => {
  const institutionName = req.body?.institutionName;
  const account = await linkAccount(req.user!.userId, institutionName);
  await syncTransactions(account.id);
  res.status(201).json(account);
});

router.post('/:id/sync', async (req, res) => {
  const count = await syncTransactions(req.params.id);
  res.json({ synced: count });
});

export default router;
