import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { userRouter } from './routes/user.js';
import { portfolioRouter } from './routes/portfolio.js';
import { swapRouter } from './routes/swap.js';
import { pricesRouter } from './routes/prices.js';
import { coinsRouter } from './routes/coins.js';
import { transactionsRouter } from './routes/transactions.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// === SECURITY MIDDLEWARE ===

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Body parsing with limit
app.use(express.json({ limit: '10kb' }));

// Rate limiting - 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// === ROUTES ===

// Health check (no rate limit)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/user', userRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/swap', swapRouter);
app.use('/api/deposit', swapRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/coins', coinsRouter);
app.use('/api/transactions', transactionsRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// === START SERVER ===

app.listen(PORT, () => {
  console.log(`🚀 Trade Demo API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔒 Security: helmet, compression, rate-limiting enabled`);
});

export default app;
