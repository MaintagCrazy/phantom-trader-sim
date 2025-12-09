import { Router, Request, Response, NextFunction } from 'express';
import { getMarketsData, getChartData, searchCoins } from '../services/coingecko.js';

export const coinsRouter: Router = Router();

// GET /api/coins - Get coin list with market data
coinsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.perPage as string) || 20, 100);
    const search = req.query.search as string;

    if (search) {
      const results = await searchCoins(search);
      res.json({
        coins: results.slice(0, perPage),
        page: 1,
        perPage,
        total: results.length,
      });
      return;
    }

    const coins = await getMarketsData(page, perPage, true);

    res.json({
      coins: coins.map(coin => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        currentPrice: coin.current_price,
        marketCap: coin.market_cap,
        marketCapRank: coin.market_cap_rank,
        priceChange24h: coin.price_change_percentage_24h,
        totalVolume: coin.total_volume,
        circulatingSupply: coin.circulating_supply,
        ath: coin.ath,
        sparkline: coin.sparkline_in_7d?.price || [],
      })),
      page,
      perPage,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/coins/:id - Get coin details
coinsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coins = await getMarketsData(1, 100);
    const coin = coins.find(c => c.id === req.params.id);

    if (!coin) {
      res.status(404).json({ error: 'Coin not found' });
      return;
    }

    res.json({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      currentPrice: coin.current_price,
      marketCap: coin.market_cap,
      marketCapRank: coin.market_cap_rank,
      priceChange24h: coin.price_change_percentage_24h,
      totalVolume: coin.total_volume,
      circulatingSupply: coin.circulating_supply,
      ath: coin.ath,
      sparkline: coin.sparkline_in_7d?.price || [],
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/coins/:id/chart - Get historical chart data
coinsRouter.get('/:id/chart', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = req.query.days || '7';
    const chartData = await getChartData(req.params.id, days as string);

    res.json({
      coinId: req.params.id,
      days,
      prices: chartData.prices,
    });
  } catch (error) {
    next(error);
  }
});

export default coinsRouter;
