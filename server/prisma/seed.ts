import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const prisma = new PrismaClient();

// Hardhat test accounts - import in MetaMask for dev testing
// #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
// #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
const DEMO_WALLET = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const ADMIN_WALLET = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

async function main() {
  const admin = await prisma.user.upsert({
    where: { walletAddress: ADMIN_WALLET },
    update: {},
    create: {
      walletAddress: ADMIN_WALLET,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    },
  });

  const user = await prisma.user.upsert({
    where: { walletAddress: DEMO_WALLET },
    update: {},
    create: {
      walletAddress: DEMO_WALLET,
      firstName: 'Demo',
      lastName: 'User',
      role: 'user',
    },
  });

  const existingAccount = await prisma.account.findFirst({ where: { userId: user.id } });
  if (!existingAccount) {
    await prisma.account.create({
      data: {
        userId: user.id,
        institutionName: 'Demo Bank',
        accountName: 'Checking',
        accountType: 'checking',
        mask: '4242',
        currentBalance: 5000,
      },
    });
  }

  console.log('Seeded wallet users:', admin.walletAddress, user.walletAddress);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
