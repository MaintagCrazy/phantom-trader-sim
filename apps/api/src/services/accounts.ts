import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import { getSimplePrices } from './coingecko.js';

interface AccountWithValue {
  id: string;
  name: string;
  isActive: boolean;
  portfolioValue: number;
  cashBalance: number;
  holdingsCount: number;
  createdAt: Date;
}

/**
 * Get all accounts for a user
 */
export async function getAccounts(userId: string): Promise<AccountWithValue[]> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    include: {
      portfolio: {
        include: { holdings: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Get prices for all holdings
  const allCoinIds = new Set<string>();
  accounts.forEach((acc) => {
    acc.portfolio?.holdings.forEach((h) => allCoinIds.add(h.coinId));
  });

  const prices = allCoinIds.size > 0 ? await getSimplePrices([...allCoinIds]) : {};

  return accounts.map((account) => {
    let holdingsValue = 0;
    const holdings = account.portfolio?.holdings || [];

    holdings.forEach((holding) => {
      const price = prices[holding.coinId]?.usd || 0;
      holdingsValue += Number(holding.amount) * price;
    });

    const cashBalance = Number(account.portfolio?.cashBalance || 0);

    return {
      id: account.id,
      name: account.name,
      isActive: account.isActive,
      portfolioValue: cashBalance + holdingsValue,
      cashBalance,
      holdingsCount: holdings.length,
      createdAt: account.createdAt,
    };
  });
}

/**
 * Get active account for a user
 */
export async function getActiveAccount(userId: string): Promise<AccountWithValue | null> {
  const accounts = await getAccounts(userId);
  return accounts.find((a) => a.isActive) || accounts[0] || null;
}

/**
 * Create a new account for a user
 */
export async function createAccount(userId: string, name: string): Promise<AccountWithValue> {
  // Check if user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Deactivate all other accounts
  await prisma.account.updateMany({
    where: { userId },
    data: { isActive: false },
  });

  // Create new account with portfolio
  const account = await prisma.account.create({
    data: {
      userId,
      name,
      isActive: true,
      portfolio: {
        create: {
          userId,
          cashBalance: 0,
        },
      },
    },
    include: {
      portfolio: true,
    },
  });

  return {
    id: account.id,
    name: account.name,
    isActive: account.isActive,
    portfolioValue: 0,
    cashBalance: 0,
    holdingsCount: 0,
    createdAt: account.createdAt,
  };
}

/**
 * Switch to a different account
 */
export async function switchAccount(userId: string, accountId: string): Promise<void> {
  // Verify account belongs to user
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) {
    throw new NotFoundError('Account not found');
  }

  // Deactivate all accounts and activate the selected one
  await prisma.$transaction([
    prisma.account.updateMany({
      where: { userId },
      data: { isActive: false },
    }),
    prisma.account.update({
      where: { id: accountId },
      data: { isActive: true },
    }),
  ]);
}

/**
 * Rename an account
 */
export async function renameAccount(
  userId: string,
  accountId: string,
  name: string
): Promise<void> {
  if (!name || name.trim().length === 0) {
    throw new ValidationError('Account name cannot be empty');
  }

  if (name.length > 50) {
    throw new ValidationError('Account name too long (max 50 characters)');
  }

  // Verify account belongs to user
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) {
    throw new NotFoundError('Account not found');
  }

  await prisma.account.update({
    where: { id: accountId },
    data: { name: name.trim() },
  });
}

/**
 * Delete an account (only if not the last one)
 */
export async function deleteAccount(userId: string, accountId: string): Promise<void> {
  // Count user's accounts
  const accountCount = await prisma.account.count({ where: { userId } });

  if (accountCount <= 1) {
    throw new ValidationError('Cannot delete the last account');
  }

  // Verify account belongs to user
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) {
    throw new NotFoundError('Account not found');
  }

  // Delete account (cascades to portfolio and transactions)
  await prisma.account.delete({ where: { id: accountId } });

  // If deleted account was active, activate the first remaining account
  if (account.isActive) {
    const firstAccount = await prisma.account.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    if (firstAccount) {
      await prisma.account.update({
        where: { id: firstAccount.id },
        data: { isActive: true },
      });
    }
  }
}

/**
 * Migrate legacy user to multi-account system
 * Creates an account from existing portfolio
 */
export async function migrateToAccounts(userId: string): Promise<AccountWithValue | null> {
  // Check if user already has accounts
  const existingAccounts = await prisma.account.count({ where: { userId } });
  if (existingAccounts > 0) {
    return getActiveAccount(userId);
  }

  // Check if user has a legacy portfolio
  const legacyPortfolio = await prisma.portfolio.findUnique({
    where: { userId },
    include: { holdings: true },
  });

  if (!legacyPortfolio) {
    // No portfolio yet - create fresh account
    return createAccount(userId, 'Main Account');
  }

  // Create account and link existing portfolio
  const account = await prisma.account.create({
    data: {
      userId,
      name: 'Main Account',
      isActive: true,
    },
  });

  // Link portfolio to account
  await prisma.portfolio.update({
    where: { id: legacyPortfolio.id },
    data: { accountId: account.id },
  });

  // Link transactions to account
  await prisma.transaction.updateMany({
    where: { userId, accountId: null },
    data: { accountId: account.id },
  });

  return getActiveAccount(userId);
}

export default {
  getAccounts,
  getActiveAccount,
  createAccount,
  switchAccount,
  renameAccount,
  deleteAccount,
  migrateToAccounts,
};
