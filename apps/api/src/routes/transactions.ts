import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { ValidationError } from '../middleware/errorHandler.js';

export const transactionsRouter = Router();

// GET /api/transactions?userId=xxx - Get user transaction history
transactionsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.query.userId as string;
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.perPage as string) || 20, 100);
    const type = req.query.type as string;

    if (!userId) {
      throw new ValidationError('userId is required');
    }

    const where: any = { userId };
    if (type) {
      where.type = type.toUpperCase();
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        fromCoinId: tx.fromCoinId,
        fromSymbol: tx.fromSymbol,
        fromAmount: tx.fromAmount ? Number(tx.fromAmount) : null,
        toCoinId: tx.toCoinId,
        toSymbol: tx.toSymbol,
        toAmount: tx.toAmount ? Number(tx.toAmount) : null,
        depositAmount: tx.depositAmount ? Number(tx.depositAmount) : null,
        priceAtTime: tx.priceAtTime ? Number(tx.priceAtTime) : null,
        totalUsdValue: Number(tx.totalUsdValue),
        createdAt: tx.createdAt,
      })),
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    next(error);
  }
});

export default transactionsRouter;
