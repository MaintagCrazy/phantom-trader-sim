import prisma from '../lib/prisma.js';
import { getSimplePrices } from './coingecko.js';
import { InsufficientBalanceError, NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import { Decimal } from '@prisma/client/runtime/library';

interface PortfolioWithValue {
  id: string;
  userId: string;
  cashBalance: number;
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  holdings: HoldingWithValue[];
}

interface HoldingWithValue {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
  avgBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  image?: string;
}

/**
 * Get portfolio with current values and P&L
 */
export async function getPortfolioWithValues(userId: string): Promise<PortfolioWithValue | null> {
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    include: { holdings: true },
  });

  if (!portfolio) return null;

  // Get current prices for all holdings
  const coinIds = portfolio.holdings.map(h => h.coinId);
  const prices = coinIds.length > 0 ? await getSimplePrices(coinIds) : {};

  let totalHoldingsValue = 0;
  let totalCostBasis = 0;

  const holdingsWithValue: HoldingWithValue[] = portfolio.holdings.map(holding => {
    const priceData = prices[holding.coinId];
    const currentPrice = priceData?.usd || 0;
    const amount = Number(holding.amount);
    const avgBuyPrice = Number(holding.avgBuyPrice);

    const currentValue = amount * currentPrice;
    const costBasis = amount * avgBuyPrice;
    const pnl = currentValue - costBasis;
    const pnlPercent = avgBuyPrice > 0 ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 : 0;

    totalHoldingsValue += currentValue;
    totalCostBasis += costBasis;

    return {
      id: holding.id,
      coinId: holding.coinId,
      symbol: holding.symbol,
      name: holding.name,
      amount,
      avgBuyPrice,
      currentPrice,
      currentValue,
      pnl,
      pnlPercent,
    };
  });

  const cashBalance = Number(portfolio.cashBalance);
  const totalValue = cashBalance + totalHoldingsValue;
  const totalPnL = totalHoldingsValue - totalCostBasis;
  const totalPnLPercent = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

  return {
    id: portfolio.id,
    userId: portfolio.userId,
    cashBalance,
    totalValue,
    totalPnL,
    totalPnLPercent,
    holdings: holdingsWithValue,
  };
}

/**
 * Add fake funds (deposit)
 */
export async function deposit(userId: string, amount: number): Promise<void> {
  if (amount <= 0) {
    throw new ValidationError('Deposit amount must be positive');
  }

  await prisma.$transaction(async (tx) => {
    // Get or create portfolio
    let portfolio = await tx.portfolio.findUnique({ where: { userId } });

    if (!portfolio) {
      portfolio = await tx.portfolio.create({
        data: { userId, cashBalance: 0 },
      });
    }

    // Update balance
    await tx.portfolio.update({
      where: { id: portfolio.id },
      data: { cashBalance: { increment: amount } },
    });

    // Record transaction
    await tx.transaction.create({
      data: {
        userId,
        type: 'DEPOSIT',
        depositAmount: amount,
        totalUsdValue: amount,
      },
    });
  });
}

/**
 * Buy crypto with USD
 */
export async function buyCrypto(
  userId: string,
  coinId: string,
  symbol: string,
  name: string,
  usdAmount: number,
  currentPrice: number
): Promise<void> {
  if (usdAmount <= 0) {
    throw new ValidationError('Buy amount must be positive');
  }

  const cryptoAmount = usdAmount / currentPrice;

  await prisma.$transaction(async (tx) => {
    const portfolio = await tx.portfolio.findUnique({
      where: { userId },
      include: { holdings: true },
    });

    if (!portfolio) {
      throw new NotFoundError('Portfolio not found. Please deposit funds first.');
    }

    const cashBalance = Number(portfolio.cashBalance);
    if (cashBalance < usdAmount) {
      throw new InsufficientBalanceError(
        `Insufficient balance. Available: $${cashBalance.toFixed(2)}, Required: $${usdAmount.toFixed(2)}`
      );
    }

    // Deduct cash
    await tx.portfolio.update({
      where: { id: portfolio.id },
      data: { cashBalance: { decrement: usdAmount } },
    });

    // Update or create holding
    const existingHolding = portfolio.holdings.find(h => h.coinId === coinId);

    if (existingHolding) {
      // Calculate new average buy price
      const oldAmount = Number(existingHolding.amount);
      const oldAvgPrice = Number(existingHolding.avgBuyPrice);
      const newAvgPrice = (oldAmount * oldAvgPrice + cryptoAmount * currentPrice) / (oldAmount + cryptoAmount);

      await tx.holding.update({
        where: { id: existingHolding.id },
        data: {
          amount: { increment: cryptoAmount },
          avgBuyPrice: newAvgPrice,
        },
      });
    } else {
      await tx.holding.create({
        data: {
          portfolioId: portfolio.id,
          coinId,
          symbol,
          name,
          amount: cryptoAmount,
          avgBuyPrice: currentPrice,
        },
      });
    }

    // Record transaction
    await tx.transaction.create({
      data: {
        userId,
        type: 'BUY',
        toCoinId: coinId,
        toSymbol: symbol,
        toAmount: cryptoAmount,
        priceAtTime: currentPrice,
        totalUsdValue: usdAmount,
      },
    });
  });
}

/**
 * Sell crypto for USD
 */
export async function sellCrypto(
  userId: string,
  coinId: string,
  cryptoAmount: number,
  currentPrice: number
): Promise<void> {
  if (cryptoAmount <= 0) {
    throw new ValidationError('Sell amount must be positive');
  }

  const usdAmount = cryptoAmount * currentPrice;

  await prisma.$transaction(async (tx) => {
    const portfolio = await tx.portfolio.findUnique({
      where: { userId },
      include: { holdings: true },
    });

    if (!portfolio) {
      throw new NotFoundError('Portfolio not found');
    }

    const holding = portfolio.holdings.find(h => h.coinId === coinId);
    if (!holding) {
      throw new NotFoundError(`You don't own any ${coinId}`);
    }

    const holdingAmount = Number(holding.amount);
    if (holdingAmount < cryptoAmount) {
      throw new InsufficientBalanceError(
        `Insufficient ${holding.symbol}. Available: ${holdingAmount.toFixed(8)}, Required: ${cryptoAmount.toFixed(8)}`
      );
    }

    // Add cash
    await tx.portfolio.update({
      where: { id: portfolio.id },
      data: { cashBalance: { increment: usdAmount } },
    });

    // Update or delete holding
    const newAmount = holdingAmount - cryptoAmount;
    if (newAmount < 0.00000001) {
      await tx.holding.delete({ where: { id: holding.id } });
    } else {
      await tx.holding.update({
        where: { id: holding.id },
        data: { amount: newAmount },
      });
    }

    // Record transaction
    await tx.transaction.create({
      data: {
        userId,
        type: 'SELL',
        fromCoinId: coinId,
        fromSymbol: holding.symbol,
        fromAmount: cryptoAmount,
        priceAtTime: currentPrice,
        totalUsdValue: usdAmount,
      },
    });
  });
}

/**
 * Swap one crypto for another
 */
export async function swapCrypto(
  userId: string,
  fromCoinId: string,
  fromAmount: number,
  toCoinId: string,
  toName: string,
  toSymbol: string,
  fromPrice: number,
  toPrice: number
): Promise<void> {
  if (fromAmount <= 0) {
    throw new ValidationError('Swap amount must be positive');
  }

  const usdValue = fromAmount * fromPrice;
  const toAmount = usdValue / toPrice;

  await prisma.$transaction(async (tx) => {
    const portfolio = await tx.portfolio.findUnique({
      where: { userId },
      include: { holdings: true },
    });

    if (!portfolio) {
      throw new NotFoundError('Portfolio not found');
    }

    const fromHolding = portfolio.holdings.find(h => h.coinId === fromCoinId);
    if (!fromHolding) {
      throw new NotFoundError(`You don't own any ${fromCoinId}`);
    }

    const fromHoldingAmount = Number(fromHolding.amount);
    if (fromHoldingAmount < fromAmount) {
      throw new InsufficientBalanceError(
        `Insufficient ${fromHolding.symbol}. Available: ${fromHoldingAmount.toFixed(8)}`
      );
    }

    // Decrease from holding
    const newFromAmount = fromHoldingAmount - fromAmount;
    if (newFromAmount < 0.00000001) {
      await tx.holding.delete({ where: { id: fromHolding.id } });
    } else {
      await tx.holding.update({
        where: { id: fromHolding.id },
        data: { amount: newFromAmount },
      });
    }

    // Increase to holding
    const toHolding = portfolio.holdings.find(h => h.coinId === toCoinId);
    if (toHolding) {
      const oldAmount = Number(toHolding.amount);
      const oldAvgPrice = Number(toHolding.avgBuyPrice);
      const newAvgPrice = (oldAmount * oldAvgPrice + toAmount * toPrice) / (oldAmount + toAmount);

      await tx.holding.update({
        where: { id: toHolding.id },
        data: {
          amount: { increment: toAmount },
          avgBuyPrice: newAvgPrice,
        },
      });
    } else {
      await tx.holding.create({
        data: {
          portfolioId: portfolio.id,
          coinId: toCoinId,
          symbol: toSymbol,
          name: toName,
          amount: toAmount,
          avgBuyPrice: toPrice,
        },
      });
    }

    // Record transaction
    await tx.transaction.create({
      data: {
        userId,
        type: 'SWAP',
        fromCoinId,
        fromSymbol: fromHolding.symbol,
        fromAmount,
        toCoinId,
        toSymbol,
        toAmount,
        priceAtTime: fromPrice,
        totalUsdValue: usdValue,
      },
    });
  });
}

export default {
  getPortfolioWithValues,
  deposit,
  buyCrypto,
  sellCrypto,
  swapCrypto,
};
