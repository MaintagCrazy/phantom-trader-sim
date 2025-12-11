import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  getAccounts,
  getActiveAccount,
  createAccount,
  switchAccount,
  renameAccount,
  deleteAccount,
  migrateToAccounts,
} from '../services/accounts.js';
import { ValidationError } from '../middleware/errorHandler.js';

export const accountsRouter: Router = Router();

// GET /api/accounts - Get all accounts for a user
const getAccountsSchema = z.object({
  userId: z.string(),
});

accountsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = getAccountsSchema.parse(req.query);
    const accounts = await getAccounts(userId);
    res.json({ accounts });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
});

// GET /api/accounts/active - Get active account for a user
accountsRouter.get('/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = getAccountsSchema.parse(req.query);
    const account = await getActiveAccount(userId);
    res.json({ account });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
});

// POST /api/accounts - Create a new account
const createAccountSchema = z.object({
  userId: z.string(),
  name: z.string().min(1).max(50),
});

accountsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, name } = createAccountSchema.parse(req.body);
    const account = await createAccount(userId, name);
    res.status(201).json({ account, message: `Account "${name}" created` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
});

// POST /api/accounts/switch - Switch to a different account
const switchAccountSchema = z.object({
  userId: z.string(),
  accountId: z.string(),
});

accountsRouter.post('/switch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, accountId } = switchAccountSchema.parse(req.body);
    await switchAccount(userId, accountId);
    res.json({ success: true, message: 'Account switched' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
});

// PUT /api/accounts/:accountId - Rename an account
const renameAccountSchema = z.object({
  userId: z.string(),
  name: z.string().min(1).max(50),
});

accountsRouter.put('/:accountId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params;
    const { userId, name } = renameAccountSchema.parse(req.body);
    await renameAccount(userId, accountId, name);
    res.json({ success: true, message: `Account renamed to "${name}"` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
});

// DELETE /api/accounts/:accountId - Delete an account
const deleteAccountSchema = z.object({
  userId: z.string(),
});

accountsRouter.delete('/:accountId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params;
    const { userId } = deleteAccountSchema.parse(req.query);
    await deleteAccount(userId, accountId);
    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
});

// POST /api/accounts/migrate - Migrate legacy user to multi-account system
const migrateSchema = z.object({
  userId: z.string(),
});

accountsRouter.post('/migrate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = migrateSchema.parse(req.body);
    const account = await migrateToAccounts(userId);
    res.json({ account, message: 'Migration complete' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
});

export default accountsRouter;
