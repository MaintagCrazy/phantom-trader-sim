# Trade Demo - Crypto Paper Trading Simulator

A Phantom-style mobile paper trading app for cryptocurrency. Practice trading with fake money using real-time prices from CoinGecko.

## Features

- **Paper Trading:** Buy, sell, and swap crypto with fake money
- **Real-Time Prices:** Live prices from CoinGecko API
- **Portfolio Tracking:** Track your holdings and P&L
- **Transaction History:** Full history of all trades
- **Beautiful UI:** Phantom wallet-inspired dark purple theme

## Tech Stack

| Component | Technology |
|-----------|------------|
| Mobile App | React Native + Expo |
| Navigation | Expo Router |
| State | Zustand |
| Styling | NativeWind (Tailwind) |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma |
| Cache | Redis |
| Deployment | Railway |

## Project Structure

```
phantom-trader-sim/
├── apps/
│   ├── mobile/          # React Native Expo app
│   └── api/             # Node.js backend
├── packages/
│   └── shared/          # Shared types
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL (or use Railway)
- Redis (optional)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MaintagCrazy/phantom-trader-sim.git
   cd phantom-trader-sim
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Setup environment:**
   ```bash
   cp apps/api/.env.example apps/api/.env
   # Edit .env with your database URL
   ```

4. **Setup database:**
   ```bash
   pnpm db:push
   ```

5. **Start the backend:**
   ```bash
   pnpm dev
   ```

6. **Start the mobile app:**
   ```bash
   pnpm dev:mobile
   ```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/user | Create/get user |
| GET | /api/portfolio | Get portfolio with P&L |
| POST | /api/deposit | Add fake funds |
| POST | /api/swap/execute | Execute trade |
| POST | /api/swap/preview | Preview swap amounts |
| GET | /api/transactions | Transaction history |
| GET | /api/prices | Get prices |
| GET | /api/coins | Coin list with market data |
| GET | /api/coins/:id/chart | Historical chart data |

## Deployment

### Railway (Backend)

1. Create a new Railway project
2. Add PostgreSQL and Redis services
3. Deploy the api folder
4. Set environment variables

### Expo (Mobile)

```bash
cd apps/mobile
eas build --platform all
```

## License

MIT
