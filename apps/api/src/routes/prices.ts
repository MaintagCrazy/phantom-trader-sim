import { Router, Request, Response, NextFunction } from 'express';
import { getSimplePrices, getMarketsData } from '../services/coingecko.js';

export const pricesRouter = Router();

// GET /api/prices?ids=bitcoin,ethereum,solana
pricesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ids = req.query.ids as string;

    if (!ids) {
      // Return top 20 market data
      const markets = await getMarketsData(1, 20);

      const prices: Record<string, { usd: number; usd_24h_change: number }> = {};
      for (const coin of markets) {
        prices[coin.id] = {
          usd: coin.current_price,
          usd_24h_change: coin.price_change_percentage_24h,
        };
      }

      res.json(prices);
      return;
    }

    const coinIds = ids.split(',').map(id => id.trim());
    const prices = await getSimplePrices(coinIds);

    res.json(prices);
  } catch (error) {
    next(error);
  }
});

export default pricesRouter;
