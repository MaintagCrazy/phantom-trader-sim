import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { z } from 'zod';
import { ValidationError } from '../middleware/errorHandler.js';

export const userRouter: Router = Router();

const createUserSchema = z.object({
  username: z.string().min(3).max(30).optional(),
});

// POST /api/user - Create or get user
userRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = createUserSchema.parse(req.body);

    if (username) {
      // Try to find existing user
      let user = await prisma.user.findUnique({
        where: { username },
        include: { portfolio: true },
      });

      if (!user) {
        // Create new user with portfolio
        user = await prisma.user.create({
          data: {
            username,
            portfolio: { create: { cashBalance: 0 } },
          },
          include: { portfolio: true },
        });
      }

      res.json({
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        hasPortfolio: !!user.portfolio,
      });
    } else {
      // Create anonymous user
      const user = await prisma.user.create({
        data: {
          portfolio: { create: { cashBalance: 0 } },
        },
        include: { portfolio: true },
      });

      res.json({
        id: user.id,
        username: null,
        createdAt: user.createdAt,
        hasPortfolio: true,
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

// GET /api/user/:id - Get user by ID
userRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { portfolio: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      hasPortfolio: !!user.portfolio,
    });
  } catch (error) {
    next(error);
  }
});

export default userRouter;
