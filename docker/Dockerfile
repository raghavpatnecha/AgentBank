# Multi-stage Dockerfile for API Test Agent with Playwright
# Base image: mcr.microsoft.com/playwright:v1.40.0-jammy
# Target size: <500MB
# Security: Non-root user, pinned versions

# Stage 1: Builder - Install dependencies and build
FROM mcr.microsoft.com/playwright:v1.40.0-jammy AS builder

# Set build arguments
ARG NODE_VERSION=18.19.0
ARG NPM_VERSION=10.2.3

# Set environment variables for build
ENV NODE_ENV=production \
    NPM_CONFIG_LOGLEVEL=error \
    CI=true

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.test.json ./

# Install dependencies with clean install
# Pin npm version for reproducibility
RUN npm install -g npm@${NPM_VERSION} && \
    npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY src ./src
COPY tests ./tests

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Runtime - Create minimal production image
FROM mcr.microsoft.com/playwright:v1.40.0-jammy AS runtime

# Set runtime arguments
ARG NODE_VERSION=18.19.0
ARG PLAYWRIGHT_VERSION=1.40.0

# Metadata labels
LABEL maintainer="API Test Agent Team" \
      version="1.0.0" \
      description="Production-ready Docker container for API Test Agent with Playwright" \
      playwright.version="${PLAYWRIGHT_VERSION}" \
      node.version="${NODE_VERSION}"

# Install production dependencies only
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates=20230311ubuntu0.22.04.1 \
        curl=7.81.0-1ubuntu1.16 \
        tzdata=2024a-0ubuntu0.22.04.1 \
        dumb-init=1.2.5-1build2 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set timezone to UTC
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

# Create non-root user 'playwright' with UID 1000
RUN groupadd -r playwright -g 1000 && \
    useradd -r -u 1000 -g playwright -m -s /bin/bash playwright && \
    mkdir -p /app /home/playwright/.cache && \
    chown -R playwright:playwright /app /home/playwright

# Set working directory
WORKDIR /app

# Copy built artifacts from builder stage
COPY --from=builder --chown=playwright:playwright /app/dist ./dist
COPY --from=builder --chown=playwright:playwright /app/node_modules ./node_modules
COPY --from=builder --chown=playwright:playwright /app/package*.json ./

# Copy configuration files
COPY --chown=playwright:playwright playwright.config.ts ./
COPY --chown=playwright:playwright .env.example ./

# Copy entrypoint script
COPY --chown=playwright:playwright docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Set environment variables for runtime
ENV NODE_ENV=production \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_HEADLESS=true \
    LOG_LEVEL=info \
    PORT=3000 \
    HEALTH_CHECK_PORT=3000

# Expose health check port
EXPOSE 3000

# Switch to non-root user
USER playwright

# Health check - verify service is responsive
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${HEALTH_CHECK_PORT}/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run entrypoint script
CMD ["/usr/local/bin/entrypoint.sh"]

# Image size optimization notes:
# - Multi-stage build reduces final image size
# - Only production dependencies included
# - npm cache cleaned
# - apt cache cleaned
# - Minimal base layers
# Target size: ~450-480MB
