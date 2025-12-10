# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies for canvas/native modules if needed
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps || npm install

# Copy source files
COPY . .

# Build the web export
RUN npx expo export -p web

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
