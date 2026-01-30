# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies for canvas/native modules if needed
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy package files (build context is apps/mobile when Root Directory is set)
COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDependencies for build)
RUN npm cache clean --force
RUN npm install --legacy-peer-deps

# Copy source files
COPY . .

# API URL for production
ARG EXPO_PUBLIC_API_URL=https://api-production-ae87.up.railway.app
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

# Clear cached builds
RUN rm -rf dist .expo node_modules/.cache

# Show what we're building with
RUN echo "Node version:" && node --version
RUN echo "NPM version:" && npm --version
RUN echo "Expo version:" && npx expo --version

# Export web build - don't set NODE_ENV=production until after npm install
ENV NODE_ENV=production
ENV EXPO_NO_DOTENV=1

RUN echo "=== Starting Expo Export ===" && \
    npx expo export -p web 2>&1 && \
    echo "=== Export complete ===" && \
    ls -la dist/ && \
    find dist -type f | head -30

# Copy PWA assets to dist folder
RUN cp -r public/* dist/ 2>/dev/null || true

# Verify index.html exists
RUN test -f dist/index.html || (echo "ERROR: index.html not found in dist!" && ls -la dist/ && exit 1)

# Production stage - serve static files
FROM node:20-slim

WORKDIR /app

# Install serve to host static files
RUN npm install -g serve

# Copy the built web files
COPY --from=builder /app/dist ./dist

EXPOSE 8081

# Serve the static web build
CMD ["serve", "-s", "dist", "-l", "8081"]
