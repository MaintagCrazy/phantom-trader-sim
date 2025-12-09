import { cacheGet, cacheSet } from '../lib/redis.js';
import prisma from '../lib/prisma.js';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const API_KEY = process.env.COINGECKO_API_KEY;

// Cache TTLs in seconds
const CACHE_TTL = {
  PRICES: 60,      // 1 minute
  COINS_LIST: 3600, // 1 hour
  CHART: 300,      // 5 minutes
  MARKETS: 60,     // 1 minute
};

interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
  circulating_supply: number;
  ath: number;
  sparkline_in_7d?: { price: number[] };
}

interface SimplePriceData {
  [coinId: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  const headers: HeadersInit = {
    'Accept': 'application/json',
  };

  if (API_KEY) {
    headers['x-cg-demo-api-key'] = API_KEY;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { headers });

      if (response.status === 429) {
        // Rate limited - wait and retry
        const waitTime = Math.pow(2, i) * 1000;
        console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  throw new Error('Failed to fetch from CoinGecko');
}

/**
 * Get market data for top coins (with logos, prices, etc.)
 */
export async function getMarketsData(
  page = 1,
  perPage = 20,
  sparkline = false
): Promise<CoinMarketData[]> {
  const cacheKey = `markets:${page}:${perPage}:${sparkline}`;

  // Check cache
  const cached = await cacheGet<CoinMarketData[]>(cacheKey);
  if (cached) return cached;

  const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=${sparkline}&price_change_percentage=24h`;

  try {
    const response = await fetchWithRetry(url);
    const data = await response.json() as CoinMarketData[];

    // Cache the result
    await cacheSet(cacheKey, data, CACHE_TTL.MARKETS);

    // Also update DB cache for fallback
    for (const coin of data) {
      await prisma.priceCache.upsert({
        where: { coinId: coin.id },
        create: {
          coinId: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price,
          change24h: coin.price_change_percentage_24h,
          image: coin.image,
        },
        update: {
          price: coin.current_price,
          change24h: coin.price_change_percentage_24h,
          image: coin.image,
        },
      }).catch(() => {/* Ignore DB cache errors */});
    }

    return data;
  } catch (error) {
    console.error('CoinGecko markets fetch error:', error);

    // Fallback to DB cache
    const dbCache = await prisma.priceCache.findMany({
      take: perPage,
      skip: (page - 1) * perPage,
    });

    if (dbCache.length > 0) {
      return dbCache.map(c => ({
        id: c.coinId,
        symbol: c.symbol.toLowerCase(),
        name: c.name,
        image: c.image || '',
        current_price: Number(c.price),
        market_cap: 0,
        market_cap_rank: 0,
        price_change_percentage_24h: Number(c.change24h) || 0,
        total_volume: 0,
        circulating_supply: 0,
        ath: 0,
      }));
    }

    throw error;
  }
}

/**
 * Get simple prices for specific coins
 */
export async function getSimplePrices(coinIds: string[]): Promise<SimplePriceData> {
  const cacheKey = `prices:${coinIds.sort().join(',')}`;

  const cached = await cacheGet<SimplePriceData>(cacheKey);
  if (cached) return cached;

  const url = `${COINGECKO_BASE_URL}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`;

  try {
    const response = await fetchWithRetry(url);
    const data = await response.json() as SimplePriceData;

    await cacheSet(cacheKey, data, CACHE_TTL.PRICES);

    return data;
  } catch (error) {
    console.error('CoinGecko simple price fetch error:', error);

    // Fallback to DB cache
    const dbPrices = await prisma.priceCache.findMany({
      where: { coinId: { in: coinIds } },
    });

    const result: SimplePriceData = {};
    for (const p of dbPrices) {
      result[p.coinId] = {
        usd: Number(p.price),
        usd_24h_change: Number(p.change24h) || 0,
      };
    }

    return result;
  }
}

/**
 * Get historical chart data for a coin
 */
export async function getChartData(
  coinId: string,
  days: number | string = 7
): Promise<{ prices: [number, number][] }> {
  const cacheKey = `chart:${coinId}:${days}`;

  const cached = await cacheGet<{ prices: [number, number][] }>(cacheKey);
  if (cached) return cached;

  const url = `${COINGECKO_BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;

  const response = await fetchWithRetry(url);
  const data = await response.json() as { prices: [number, number][] };

  await cacheSet(cacheKey, data, CACHE_TTL.CHART);

  return data;
}

/**
 * Get coin details
 */
export async function getCoinDetails(coinId: string): Promise<CoinMarketData | null> {
  const markets = await getMarketsData(1, 100);
  return markets.find(c => c.id === coinId) || null;
}

/**
 * Search coins by name/symbol
 */
export async function searchCoins(query: string): Promise<CoinMarketData[]> {
  const markets = await getMarketsData(1, 100);
  const q = query.toLowerCase();

  return markets.filter(
    c => c.name.toLowerCase().includes(q) ||
         c.symbol.toLowerCase().includes(q) ||
         c.id.toLowerCase().includes(q)
  );
}

export default {
  getMarketsData,
  getSimplePrices,
  getChartData,
  getCoinDetails,
  searchCoins,
};
