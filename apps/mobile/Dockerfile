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

# Install dependencies (clean install)
RUN npm cache clean --force
RUN npm ci --legacy-peer-deps || npm install

# Copy source files
COPY . .

# Build the web export (production mode)
ENV NODE_ENV=production
ENV EXPO_NO_DOTENV=1

# Clear ALL cached builds
RUN rm -rf dist .expo node_modules/.cache

# Show what we're building with
RUN echo "Node version:" && node --version
RUN echo "NPM version:" && npm --version
RUN echo "Expo version:" && npx expo --version

# Export web build
RUN npx expo export -p web 2>&1 || (echo "Build failed, showing directory:" && ls -la && exit 1)

# Copy PWA assets to dist folder
RUN cp -r public/* dist/ 2>/dev/null || true
RUN echo "PWA assets copied. Contents of dist:" && ls -la dist/

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
