import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  openPosition,
  closePosition,
  getPositions,
  getPositionsWithPnL,
  checkLiquidations,
  getMarginStats,
  LEVERAGE_OPTIONS,
} from '../services/margin.js';

const router = Router();

// Validation schemas
const openPositionSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  accountId: z.string().optional(),
  coinId: z.string().min(1, 'coinId is required'),
  symbol: z.string().min(1, 'symbol is required'),
  name: z.string().min(1, 'name is required'),
  type: z.enum(['LONG', 'SHORT']),
  margin: z.number().min(10, 'Minimum margin is $10'),
  leverage: z.number().refine(
    (val) => LEVERAGE_OPTIONS.includes(val as any),
    { message: `Leverage must be one of: ${LEVERAGE_OPTIONS.join(', ')}` }
  ),
  currentPrice: z.number().positive('Price must be positive'),
});

const closePositionSchema = z.object({
  positionId: z.string().min(1, 'positionId is required'),
  userId: z.string().min(1, 'userId is required'),
  currentPrice: z.number().positive('Price must be positive'),
});

const checkLiquidationsSchema = z.object({
  prices: z.record(z.number().positive()),
});

/**
 * POST /api/margin/open
 * Open a new leveraged position
 */
router.post('/open', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = openPositionSchema.parse(req.body);

    const result = await openPosition({
      userId: validatedData.userId,
      accountId: validatedData.accountId,
      coinId: validatedData.coinId,
      symbol: validatedData.symbol,
      name: validatedData.name,
      type: validatedData.type,
      margin: validatedData.margin,
      leverage: validatedData.leverage as 2 | 5 | 10,
      currentPrice: validatedData.currentPrice,
    });

    res.status(201).json({
      success: true,
      position: result.position,
      newCashBalance: result.newCashBalance,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    if (error.message.includes('Insufficient') || error.message.includes('Minimum')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * POST /api/margin/close
 * Close an existing position
 */
router.post('/close', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = closePositionSchema.parse(req.body);

    const result = await closePosition({
      positionId: validatedData.positionId,
      userId: validatedData.userId,
      currentPrice: validatedData.currentPrice,
    });

    res.json({
      success: true,
      position: result.position,
      pnl: result.pnl,
      marginReturn: result.marginReturn,
      newCashBalance: result.newCashBalance,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    if (error.message === 'Position not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes('already closed')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * GET /api/margin/positions
 * Get all positions for a user
 */
router.get('/positions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, accountId, status } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    const validStatus = status as 'OPEN' | 'CLOSED' | 'LIQUIDATED' | 'ALL' | undefined;
    const positions = await getPositions(
      userId,
      accountId as string | undefined,
      validStatus || 'ALL'
    );

    res.json({
      success: true,
      positions,
      count: positions.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/margin/positions/live
 * Get open positions with live P&L calculation
 */
router.get('/positions/live', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, accountId, prices } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Parse prices from query string (format: "bitcoin:65000,ethereum:3500")
    const priceMap = new Map<string, number>();
    if (prices && typeof prices === 'string') {
      prices.split(',').forEach(pair => {
        const [coinId, price] = pair.split(':');
        if (coinId && price) {
          priceMap.set(coinId, parseFloat(price));
        }
      });
    }

    const positions = await getPositionsWithPnL(
      userId,
      priceMap,
      accountId as string | undefined
    );

    res.json({
      success: true,
      positions,
      count: positions.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/margin/check-liquidations
 * Check all open positions for liquidation (called by cron or price update)
 */
router.post('/check-liquidations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prices } = checkLiquidationsSchema.parse(req.body);

    const priceMap = new Map<string, number>(Object.entries(prices));
    const result = await checkLiquidations(priceMap);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    next(error);
  }
});

/**
 * GET /api/margin/stats
 * Get margin trading statistics for a user
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, accountId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    const stats = await getMarginStats(userId, accountId as string | undefined);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/margin/leverage-options
 * Get available leverage options
 */
router.get('/leverage-options', (_req: Request, res: Response) => {
  res.json({
    success: true,
    options: LEVERAGE_OPTIONS,
    descriptions: {
      2: { label: '2x', description: 'Conservative - Liquidation at -50%', risk: 'Low' },
      5: { label: '5x', description: 'Moderate - Liquidation at -20%', risk: 'Medium' },
      10: { label: '10x', description: 'Aggressive - Liquidation at -10%', risk: 'High' },
    },
  });
});

export { router as marginRouter };
