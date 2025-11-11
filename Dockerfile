# =============================================================================
# Smart Counselor Appointment Scheduler - Production Dockerfile
# Base Image: Node.js 22 Alpine for minimal size
# =============================================================================

# Stage 1: Build dependencies
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci --only=production && \
    npm cache clean --force

# =============================================================================
# Stage 2: Production image
# =============================================================================

FROM node:22-alpine

# Build argument for commit hash
ARG GIT_COMMIT_HASH=unknown

# Set NODE_ENV to production
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Copy production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY src ./src
COPY public ./public
COPY sql ./sql
COPY scripts ./scripts

# Generate version.json during build with commit hash
RUN BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ) && \
    BUILD_TIMESTAMP=$(date +%s) && \
    echo "{\"version\":\"1.${GIT_COMMIT_HASH}.${BUILD_TIMESTAMP}\",\"commitHash\":\"${GIT_COMMIT_HASH}\",\"branch\":\"main\",\"buildTime\":\"${BUILD_TIME}\",\"buildTimestamp\":${BUILD_TIMESTAMP}}" > /app/public/version.json && \
    echo "Generated version.json:" && \
    cat /app/public/version.json

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });"

# Start the application
CMD ["node", "src/server.js"]
