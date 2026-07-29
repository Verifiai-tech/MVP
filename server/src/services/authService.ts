import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import { config } from '../config/index.js';
import type { JwtPayload } from '../middleware/auth.js';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const createAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>) => {
  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiry });
};

export const createRefreshToken = () => uuidv4();

export const saveRefreshToken = async (userId: string, token: string, expiresAt: Date) => {
  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
};

export const findRefreshToken = async (token: string) => {
  const result = await query(
    `SELECT rt.*, u.id as user_id, u.email, u.role
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token = $1 AND rt.expires_at > NOW()`,
    [token]
  );
  return result.rows[0];
};

export const revokeRefreshToken = async (token: string) => {
  await query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
};

export const signRefreshToken = (userId: string, email: string, role: string) => {
  return jwt.sign(
    { userId, email, role, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry }
  );
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload & { type: string };
};
