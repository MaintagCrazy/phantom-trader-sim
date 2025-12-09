import { Router, Request, Response, NextFunction } from 'express';
import { getPortfolioWithValues } from '../services/portfolio.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';

export const portfolioRouter: Router = Router();

// GET /api/portfolio?userId=xxx - Get user portfolio with current values
portfolioRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      throw new ValidationError('userId is required');
    }

    const portfolio = await getPortfolioWithValues(userId);

    if (!portfolio) {
      throw new NotFoundError('Portfolio not found. Please deposit funds first.');
    }

    res.json(portfolio);
  } catch (error) {
    next(error);
  }
});

export default portfolioRouter;
