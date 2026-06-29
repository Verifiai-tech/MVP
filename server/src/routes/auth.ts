import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../services/authService.js';

const router = Router();

router.post(
  '/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, firstName, lastName } = req.body;
    const passwordHash = await hashPassword(password);

    try {
      const result = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, first_name, last_name, role, created_at`,
        [email, passwordHash, firstName || null, lastName || null]
      );
      const user = result.rows[0];
      const accessToken = createAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      const refreshToken = signRefreshToken(user.id, user.email, user.role);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await saveRefreshToken(user.id, refreshToken, expiresAt);

      res.status(201).json({
        user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role },
        accessToken,
        refreshToken,
        expiresIn: 900,
      });
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === '23505') {
        return res.status(400).json({ error: 'Email already registered' });
      }
      throw err;
    }
  }
);

router.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const result = await query(
      'SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    const user = result.rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = createAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken(user.id, user.email, user.role);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await saveRefreshToken(user.id, refreshToken, expiresAt);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      accessToken,
      refreshToken,
      expiresIn: 900,
    });
  }
);

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  try {
    verifyRefreshToken(refreshToken);
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  const stored = await findRefreshToken(refreshToken);
  if (!stored) return res.status(401).json({ error: 'Refresh token expired or revoked' });

  await revokeRefreshToken(refreshToken);
  const newAccessToken = createAccessToken({
    userId: stored.user_id,
    email: stored.email,
    role: stored.role,
  });
  const newRefreshToken = signRefreshToken(stored.user_id, stored.email, stored.role);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await saveRefreshToken(stored.user_id, newRefreshToken, expiresAt);

  res.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: 900,
  });
});

router.post('/logout', body('refreshToken').optional(), async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await revokeRefreshToken(refreshToken).catch(() => {});
  res.json({ ok: true });
});

router.get('/me', authenticate, async (req, res) => {
  const result = await query(
    'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
    [req.user!.userId]
  );
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
  });
});

export default router;
