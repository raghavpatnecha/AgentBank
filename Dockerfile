# Multi-stage Dockerfile for API Test Agent
# Optimized for both development and CI/CD environments

# Stage 1: Dependencies
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Stage 2: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code and config files
COPY package*.json ./
COPY tsconfig*.json ./
COPY src ./src

# Build the TypeScript code
RUN npm run build

# Stage 3: Test Runner (Production-like with dev dependencies)
FROM node:18-alpine AS test-runner

# Install bash and other utilities for test scripts
RUN apk add --no-cache bash curl jq

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (we need dev dependencies for testing)
RUN npm ci

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy test files and configs
COPY tests ./tests
COPY vitest.config.ts ./
COPY playwright.config.ts ./
COPY tsconfig*.json ./

# Copy environment example
COPY .env.example ./

# Create directories for test results and coverage
RUN mkdir -p test-results coverage playwright-report

# Install Playwright browsers
RUN npx playwright install --with-deps chromium

# Set environment variables
ENV NODE_ENV=test
ENV CI=true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Default command runs all tests
CMD ["npm", "run", "test"]

# Stage 4: Development
FROM node:18-alpine AS development

RUN apk add --no-cache bash curl jq git

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source and test files
COPY . .

# Install Playwright browsers
RUN npx playwright install --with-deps chromium

ENV NODE_ENV=development

CMD ["npm", "run", "test:watch"]
