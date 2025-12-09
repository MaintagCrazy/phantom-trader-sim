import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { deposit, buyCrypto, sellCrypto, swapCrypto } from '../services/portfolio.js';
import { getSimplePrices } from '../services/coingecko.js';
import { ValidationError } from '../middleware/errorHandler.js';

export const swapRouter: Router = Router();

// POST /api/deposit - Add fake funds
const depositSchema = z.object({
  userId: z.string(),
  amount: z.number().positive(),
});

swapRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, amount } = depositSchema.parse(req.body);

    await deposit(userId, amount);

    res.json({
      success: true,
      message: `Deposited $${amount.toFixed(2)}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
});

// POST /api/swap - Execute a trade (buy, sell, or swap)
const swapSchema = z.object({
  userId: z.string(),
  type: z.enum(['buy', 'sell', 'swap']),
  // For buy: usdAmount + toCoin
  // For sell: fromCoin + cryptoAmount
  // For swap: fromCoin + fromAmount + toCoin
  fromCoinId: z.string().optional(),
  fromAmount: z.number().positive().optional(),
  toCoinId: z.string().optional(),
  toSymbol: z.string().optional(),
  toName: z.string().optional(),
  usdAmount: z.number().positive().optional(),
  cryptoAmount: z.number().positive().optional(),
});

swapRouter.post('/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = swapSchema.parse(req.body);

    // Get current prices
    const coinIds = [data.fromCoinId, data.toCoinId].filter(Boolean) as string[];
    const prices = await getSimplePrices(coinIds);

    if (data.type === 'buy') {
      if (!data.usdAmount || !data.toCoinId || !data.toSymbol || !data.toName) {
        throw new ValidationError('Buy requires usdAmount, toCoinId, toSymbol, and toName');
      }

      const toPrice = prices[data.toCoinId]?.usd;
      if (!toPrice) {
        throw new ValidationError('Could not get price for ' + data.toCoinId);
      }

      await buyCrypto(
        data.userId,
        data.toCoinId,
        data.toSymbol,
        data.toName,
        data.usdAmount,
        toPrice
      );

      const cryptoAmount = data.usdAmount / toPrice;
      res.json({
        success: true,
        type: 'buy',
        message: `Bought ${cryptoAmount.toFixed(8)} ${data.toSymbol} for $${data.usdAmount.toFixed(2)}`,
        cryptoAmount,
        usdAmount: data.usdAmount,
        price: toPrice,
      });

    } else if (data.type === 'sell') {
      if (!data.cryptoAmount || !data.fromCoinId) {
        throw new ValidationError('Sell requires cryptoAmount and fromCoinId');
      }

      const fromPrice = prices[data.fromCoinId]?.usd;
      if (!fromPrice) {
        throw new ValidationError('Could not get price for ' + data.fromCoinId);
      }

      await sellCrypto(data.userId, data.fromCoinId, data.cryptoAmount, fromPrice);

      const usdAmount = data.cryptoAmount * fromPrice;
      res.json({
        success: true,
        type: 'sell',
        message: `Sold ${data.cryptoAmount.toFixed(8)} for $${usdAmount.toFixed(2)}`,
        cryptoAmount: data.cryptoAmount,
        usdAmount,
        price: fromPrice,
      });

    } else if (data.type === 'swap') {
      if (!data.fromCoinId || !data.fromAmount || !data.toCoinId || !data.toSymbol || !data.toName) {
        throw new ValidationError('Swap requires fromCoinId, fromAmount, toCoinId, toSymbol, and toName');
      }

      const fromPrice = prices[data.fromCoinId]?.usd;
      const toPrice = prices[data.toCoinId]?.usd;

      if (!fromPrice || !toPrice) {
        throw new ValidationError('Could not get prices');
      }

      await swapCrypto(
        data.userId,
        data.fromCoinId,
        data.fromAmount,
        data.toCoinId,
        data.toName,
        data.toSymbol,
        fromPrice,
        toPrice
      );

      const usdValue = data.fromAmount * fromPrice;
      const toAmount = usdValue / toPrice;

      res.json({
        success: true,
        type: 'swap',
        message: `Swapped ${data.fromAmount.toFixed(8)} for ${toAmount.toFixed(8)} ${data.toSymbol}`,
        fromAmount: data.fromAmount,
        toAmount,
        fromPrice,
        toPrice,
        usdValue,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
});

// POST /api/swap/preview - Preview a swap (get calculated amounts)
const previewSchema = z.object({
  fromCoinId: z.string().optional(),
  toCoinId: z.string().optional(),
  fromAmount: z.number().positive().optional(),
  usdAmount: z.number().positive().optional(),
});

swapRouter.post('/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = previewSchema.parse(req.body);

    const coinIds = [data.fromCoinId, data.toCoinId].filter(Boolean) as string[];
    const prices = await getSimplePrices(coinIds);

    const fromPrice = data.fromCoinId ? prices[data.fromCoinId]?.usd : null;
    const toPrice = data.toCoinId ? prices[data.toCoinId]?.usd : null;

    let usdValue = data.usdAmount;
    let fromAmount = data.fromAmount;
    let toAmount: number | null = null;

    // Calculate based on what's provided
    if (fromAmount && fromPrice) {
      usdValue = fromAmount * fromPrice;
    }

    if (usdValue && toPrice) {
      toAmount = usdValue / toPrice;
    }

    res.json({
      fromPrice,
      toPrice,
      usdValue,
      fromAmount,
      toAmount,
      exchangeRate: fromPrice && toPrice ? fromPrice / toPrice : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
});

export default swapRouter;
