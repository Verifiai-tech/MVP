import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { verifyMessage } from 'viem';
import { prisma } from '../lib/prisma.js';
import { signToken } from './auth.service.js';

const NONCE_TTL_MS = 5 * 60 * 1000;
const nonceStore = new Map<string, { nonce: string; expires: number }>();

function normalizeKey(address: string): string {
  if (address.toLowerCase().startsWith('0x')) return address.toLowerCase();
  return address;
}

export function createNonce(address: string): string {
  const key = normalizeKey(address);
  const nonce = `fp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  nonceStore.set(key, { nonce, expires: Date.now() + NONCE_TTL_MS });
  return nonce;
}

export function consumeNonce(address: string, nonce: string): boolean {
  const key = normalizeKey(address);
  const stored = nonceStore.get(key);
  if (!stored || stored.nonce !== nonce || Date.now() > stored.expires) return false;
  nonceStore.delete(key);
  return true;
}

function isEvmAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr) || /^[a-fA-F0-9]{40}$/.test(addr);
}

export async function verifyWalletSignature(
  address: string,
  message: string,
  signature: string
): Promise<boolean> {
  if (isEvmAddress(address)) {
    const addr = address.startsWith('0x') ? address.toLowerCase() : `0x${address.toLowerCase()}`;
    const sig = signature.startsWith('0x') ? (signature as `0x${string}`) : (`0x${signature}` as `0x${string}`);

    try {
      // viem verifyMessage returns boolean
      return await verifyMessage({
        address: addr as `0x${string}`,
        message,
        signature: sig,
      });
    } catch {
      return false;
    }
  }

  // Solana (Ed25519)
  try {
    const pk = bs58.decode(address);
    const msg = new TextEncoder().encode(message);
    const sig = Buffer.from(signature, 'base64');
    if (pk.length !== 32 || sig.length !== 64) return false;
    return nacl.sign.detached.verify(msg, sig, pk);
  } catch {
    return false;
  }
}

export async function findUserByWallet(address: string) {
  const key = normalizeKey(address);
  return prisma.user.findFirst({
    where: { walletAddress: key, isActive: true },
  });
}

export async function createWalletUser(address: string) {
  const key = normalizeKey(address);
  return prisma.user.create({
    data: {
      walletAddress: key,
      email: null,
      passwordHash: null,
    },
    select: { id: true, walletAddress: true, email: true, firstName: true, lastName: true, role: true },
  });
}

export function signWalletToken(user: { id: string; email?: string | null; role: string }) {
  return signToken({ userId: user.id, email: user.email ?? undefined, role: user.role });
}
