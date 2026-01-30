# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json* ./

# Install ALL dependencies (devDependencies needed for build)
RUN npm install --legacy-peer-deps

# Copy source files
COPY . .

# API URL for production
ARG EXPO_PUBLIC_API_URL=https://api-production-ae87.up.railway.app
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

# Clear any cached builds
RUN rm -rf dist .expo node_modules/.cache

# Build the web export
ENV NODE_ENV=production
ENV EXPO_NO_DOTENV=1

RUN npx expo export -p web

# Copy PWA assets
RUN cp -r public/* dist/ 2>/dev/null || true

# Verify build succeeded
RUN test -f dist/index.html || (echo "ERROR: Build failed - no index.html" && exit 1)

# Production stage
FROM node:20-slim

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Railway sets PORT env variable automatically (default 3000)
# We need to use $PORT, not a hardcoded value
ENV PORT=8080

EXPOSE 8080

# Use shell form to expand $PORT variable
CMD serve -s dist -l $PORT
