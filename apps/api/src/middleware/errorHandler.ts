import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({
      error: 'Database operation failed',
      statusCode: 400,
    });
    return;
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    statusCode: 500,
  });
}
