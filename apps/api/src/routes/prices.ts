import { Router, Request, Response, NextFunction } from 'express';
import { getSimplePrices, getMarketsData } from '../services/coingecko.js';
import { cacheGet, cacheSet } from '../lib/redis.js';

export const pricesRouter: Router = Router();

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

// GET /api/prices/trending - Get top gainers
pricesRouter.get('/trending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'trending';

    // Check cache
    const cached = await cacheGet<any[]>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    // Get market data and sort by 24h change
    const markets = await getMarketsData(1, 50);
    const trending = markets
      .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
      .slice(0, 10)
      .map(coin => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        currentPrice: coin.current_price,
        priceChange24h: coin.price_change_percentage_24h,
      }));

    // Cache for 5 minutes
    await cacheSet(cacheKey, trending, 300);

    res.json(trending);
  } catch (error) {
    next(error);
  }
});

export default pricesRouter;
