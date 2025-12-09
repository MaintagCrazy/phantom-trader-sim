import express from 'express';
import cors from 'cors';
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

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/user', userRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/swap', swapRouter);
app.use('/api/deposit', swapRouter); // Deposit is handled in swap router
app.use('/api/prices', pricesRouter);
app.use('/api/coins', coinsRouter);
app.use('/api/transactions', transactionsRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Trade Demo API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
