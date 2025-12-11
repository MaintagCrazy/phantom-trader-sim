import { PrismaClient, PositionType, PositionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Supported leverage levels
export const LEVERAGE_OPTIONS = [2, 5, 10] as const;
export type LeverageLevel = typeof LEVERAGE_OPTIONS[number];

interface OpenPositionParams {
  userId: string;
  accountId?: string;
  coinId: string;
  symbol: string;
  name: string;
  type: 'LONG' | 'SHORT';
  margin: number; // USD collateral amount
  leverage: LeverageLevel;
  currentPrice: number;
}

interface ClosePositionParams {
  positionId: string;
  userId: string;
  currentPrice: number;
}

interface PositionWithPnL {
  id: string;
  userId: string;
  accountId: string | null;
  coinId: string;
  symbol: string;
  name: string;
  type: PositionType;
  leverage: number;
  entryPrice: number;
  amount: number;
  margin: number;
  liquidationPrice: number;
  status: PositionStatus;
  realizedPnl: number | null;
  closePrice: number | null;
  createdAt: Date;
  closedAt: Date | null;
  // Calculated fields
  unrealizedPnl?: number;
  unrealizedPnlPercent?: number;
  currentValue?: number;
}

/**
 * Calculate liquidation price for a position
 * Long: liquidationPrice = entryPrice * (1 - 1/leverage + fee buffer)
 * Short: liquidationPrice = entryPrice * (1 + 1/leverage - fee buffer)
 */
function calculateLiquidationPrice(
  entryPrice: number,
  type: 'LONG' | 'SHORT',
  leverage: number
): number {
  // Add 5% buffer to avoid exact liquidation edge cases
  const buffer = 0.05;

  if (type === 'LONG') {
    // Liquidated when price drops by (100% / leverage - buffer)
    return entryPrice * (1 - (1 / leverage) + buffer);
  } else {
    // Liquidated when price rises by (100% / leverage - buffer)
    return entryPrice * (1 + (1 / leverage) - buffer);
  }
}

/**
 * Calculate unrealized P&L for a position
 */
function calculatePnL(
  entryPrice: number,
  currentPrice: number,
  margin: number,
  leverage: number,
  type: 'LONG' | 'SHORT'
): { pnl: number; pnlPercent: number } {
  let pnlPercent: number;

  if (type === 'LONG') {
    // Long profits when price goes up
    pnlPercent = ((currentPrice - entryPrice) / entryPrice) * leverage * 100;
  } else {
    // Short profits when price goes down
    pnlPercent = ((entryPrice - currentPrice) / entryPrice) * leverage * 100;
  }

  const pnl = (pnlPercent / 100) * margin;

  return { pnl, pnlPercent };
}

/**
 * Check if a position should be liquidated
 */
function shouldLiquidate(
  currentPrice: number,
  liquidationPrice: number,
  type: 'LONG' | 'SHORT'
): boolean {
  if (type === 'LONG') {
    return currentPrice <= liquidationPrice;
  } else {
    return currentPrice >= liquidationPrice;
  }
}

/**
 * Open a new leveraged position
 */
export async function openPosition(params: OpenPositionParams) {
  const { userId, accountId, coinId, symbol, name, type, margin, leverage, currentPrice } = params;

  // Validate leverage
  if (!LEVERAGE_OPTIONS.includes(leverage as LeverageLevel)) {
    throw new Error(`Invalid leverage. Must be one of: ${LEVERAGE_OPTIONS.join(', ')}`);
  }

  // Validate margin
  if (margin < 10) {
    throw new Error('Minimum margin is $10');
  }

  // Get the portfolio (either from account or legacy user portfolio)
  let portfolio;
  if (accountId) {
    portfolio = await prisma.portfolio.findUnique({
      where: { accountId },
    });
  } else {
    portfolio = await prisma.portfolio.findUnique({
      where: { userId },
    });
  }

  if (!portfolio) {
    throw new Error('Portfolio not found');
  }

  const cashBalance = Number(portfolio.cashBalance);
  if (cashBalance < margin) {
    throw new Error('Insufficient funds for margin');
  }

  // Calculate position details
  const positionValue = margin * leverage; // Total position size in USD
  const amount = positionValue / currentPrice; // Amount of crypto controlled
  const liquidationPrice = calculateLiquidationPrice(currentPrice, type, leverage);

  // Create position and deduct margin in a transaction
  const [position, updatedPortfolio] = await prisma.$transaction([
    // Create the margin position
    prisma.marginPosition.create({
      data: {
        userId,
        accountId,
        coinId,
        symbol: symbol.toUpperCase(),
        name,
        type: type as PositionType,
        leverage,
        entryPrice: currentPrice,
        amount,
        margin,
        liquidationPrice,
        status: 'OPEN',
      },
    }),
    // Deduct margin from cash balance
    prisma.portfolio.update({
      where: { id: portfolio.id },
      data: {
        cashBalance: { decrement: margin },
      },
    }),
  ]);

  // Create transaction record
  await prisma.transaction.create({
    data: {
      userId,
      accountId,
      type: 'MARGIN_OPEN',
      toCoinId: coinId,
      toSymbol: symbol.toUpperCase(),
      toAmount: amount,
      priceAtTime: currentPrice,
      totalUsdValue: margin,
    },
  });

  return {
    position: {
      ...position,
      entryPrice: Number(position.entryPrice),
      amount: Number(position.amount),
      margin: Number(position.margin),
      liquidationPrice: Number(position.liquidationPrice),
    },
    newCashBalance: Number(updatedPortfolio.cashBalance),
  };
}

/**
 * Close an existing position
 */
export async function closePosition(params: ClosePositionParams) {
  const { positionId, userId, currentPrice } = params;

  // Get the position
  const position = await prisma.marginPosition.findUnique({
    where: { id: positionId },
  });

  if (!position) {
    throw new Error('Position not found');
  }

  if (position.userId !== userId) {
    throw new Error('Unauthorized');
  }

  if (position.status !== 'OPEN') {
    throw new Error('Position is already closed');
  }

  // Calculate final P&L
  const { pnl } = calculatePnL(
    Number(position.entryPrice),
    currentPrice,
    Number(position.margin),
    position.leverage,
    position.type
  );

  // Get portfolio
  let portfolio;
  if (position.accountId) {
    portfolio = await prisma.portfolio.findUnique({
      where: { accountId: position.accountId },
    });
  } else {
    portfolio = await prisma.portfolio.findUnique({
      where: { userId },
    });
  }

  if (!portfolio) {
    throw new Error('Portfolio not found');
  }

  // Calculate return: margin + profit (or margin - loss, but never less than 0)
  const marginReturn = Math.max(0, Number(position.margin) + pnl);

  // Close position and return margin + P&L
  const [closedPosition, updatedPortfolio] = await prisma.$transaction([
    prisma.marginPosition.update({
      where: { id: positionId },
      data: {
        status: 'CLOSED',
        closePrice: currentPrice,
        realizedPnl: pnl,
        closedAt: new Date(),
      },
    }),
    prisma.portfolio.update({
      where: { id: portfolio.id },
      data: {
        cashBalance: { increment: marginReturn },
      },
    }),
  ]);

  // Create transaction record
  await prisma.transaction.create({
    data: {
      userId,
      accountId: position.accountId,
      type: 'MARGIN_CLOSE',
      fromCoinId: position.coinId,
      fromSymbol: position.symbol,
      fromAmount: position.amount,
      priceAtTime: currentPrice,
      totalUsdValue: marginReturn,
    },
  });

  return {
    position: {
      ...closedPosition,
      entryPrice: Number(closedPosition.entryPrice),
      amount: Number(closedPosition.amount),
      margin: Number(closedPosition.margin),
      liquidationPrice: Number(closedPosition.liquidationPrice),
      closePrice: Number(closedPosition.closePrice),
      realizedPnl: Number(closedPosition.realizedPnl),
    },
    pnl,
    marginReturn,
    newCashBalance: Number(updatedPortfolio.cashBalance),
  };
}

/**
 * Liquidate a position (called when price hits liquidation threshold)
 */
export async function liquidatePosition(positionId: string) {
  const position = await prisma.marginPosition.findUnique({
    where: { id: positionId },
  });

  if (!position || position.status !== 'OPEN') {
    return null;
  }

  // Liquidation: user loses entire margin
  const [liquidatedPosition] = await prisma.$transaction([
    prisma.marginPosition.update({
      where: { id: positionId },
      data: {
        status: 'LIQUIDATED',
        closePrice: position.liquidationPrice,
        realizedPnl: -Number(position.margin), // Lost entire margin
        closedAt: new Date(),
      },
    }),
  ]);

  // Create liquidation transaction record
  await prisma.transaction.create({
    data: {
      userId: position.userId,
      accountId: position.accountId,
      type: 'MARGIN_CLOSE',
      fromCoinId: position.coinId,
      fromSymbol: position.symbol,
      fromAmount: position.amount,
      priceAtTime: position.liquidationPrice,
      totalUsdValue: 0, // Nothing returned on liquidation
    },
  });

  return liquidatedPosition;
}

/**
 * Get all positions for a user
 */
export async function getPositions(
  userId: string,
  accountId?: string,
  status?: 'OPEN' | 'CLOSED' | 'LIQUIDATED' | 'ALL'
) {
  const where: any = { userId };

  if (accountId) {
    where.accountId = accountId;
  }

  if (status && status !== 'ALL') {
    where.status = status;
  }

  const positions = await prisma.marginPosition.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return positions.map(p => ({
    id: p.id,
    userId: p.userId,
    accountId: p.accountId,
    coinId: p.coinId,
    symbol: p.symbol,
    name: p.name,
    type: p.type,
    leverage: p.leverage,
    entryPrice: Number(p.entryPrice),
    amount: Number(p.amount),
    margin: Number(p.margin),
    liquidationPrice: Number(p.liquidationPrice),
    status: p.status,
    realizedPnl: p.realizedPnl ? Number(p.realizedPnl) : null,
    closePrice: p.closePrice ? Number(p.closePrice) : null,
    createdAt: p.createdAt,
    closedAt: p.closedAt,
  }));
}

/**
 * Get positions with live P&L calculation
 */
export async function getPositionsWithPnL(
  userId: string,
  priceMap: Map<string, number>,
  accountId?: string
): Promise<PositionWithPnL[]> {
  const positions = await getPositions(userId, accountId, 'OPEN');

  return positions.map(p => {
    const currentPrice = priceMap.get(p.coinId) || p.entryPrice;
    const { pnl, pnlPercent } = calculatePnL(
      p.entryPrice,
      currentPrice,
      p.margin,
      p.leverage,
      p.type
    );

    return {
      ...p,
      unrealizedPnl: pnl,
      unrealizedPnlPercent: pnlPercent,
      currentValue: p.margin + pnl,
    };
  });
}

/**
 * Check all open positions for liquidation
 * Called periodically by a cron job or on price updates
 */
export async function checkLiquidations(priceMap: Map<string, number>) {
  const openPositions = await prisma.marginPosition.findMany({
    where: { status: 'OPEN' },
  });

  const liquidated: string[] = [];

  for (const position of openPositions) {
    const currentPrice = priceMap.get(position.coinId);
    if (!currentPrice) continue;

    if (shouldLiquidate(currentPrice, Number(position.liquidationPrice), position.type)) {
      await liquidatePosition(position.id);
      liquidated.push(position.id);
    }
  }

  return { liquidatedCount: liquidated.length, liquidatedIds: liquidated };
}

/**
 * Get margin trading stats for a user
 */
export async function getMarginStats(userId: string, accountId?: string) {
  const where: any = { userId };
  if (accountId) where.accountId = accountId;

  const [openPositions, closedPositions] = await Promise.all([
    prisma.marginPosition.findMany({
      where: { ...where, status: 'OPEN' },
    }),
    prisma.marginPosition.findMany({
      where: { ...where, status: { in: ['CLOSED', 'LIQUIDATED'] } },
    }),
  ]);

  const totalMarginUsed = openPositions.reduce(
    (sum, p) => sum + Number(p.margin),
    0
  );

  const totalRealizedPnL = closedPositions.reduce(
    (sum, p) => sum + (Number(p.realizedPnl) || 0),
    0
  );

  const winningTrades = closedPositions.filter(
    p => p.realizedPnl && Number(p.realizedPnl) > 0
  ).length;

  const losingTrades = closedPositions.filter(
    p => p.realizedPnl && Number(p.realizedPnl) < 0
  ).length;

  return {
    openPositionsCount: openPositions.length,
    closedPositionsCount: closedPositions.length,
    totalMarginUsed,
    totalRealizedPnL,
    winningTrades,
    losingTrades,
    winRate: closedPositions.length > 0
      ? (winningTrades / closedPositions.length) * 100
      : 0,
  };
}
