FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client
RUN pnpm run db:generate

# Build TypeScript
RUN pnpm run build

# Production image
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production

EXPOSE 3001

CMD ["npm", "run", "start"]
