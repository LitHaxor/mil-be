# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install yarn
RUN corepack enable && corepack prepare yarn@stable --activate

# Copy package files
COPY package.json yarn.lock ./

# Install all dependencies (including dev dependencies for build)
RUN yarn install

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Stage 2: Production
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Install yarn
RUN corepack enable && corepack prepare yarn@stable --activate

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY package.json yarn.lock ./

# Copy node_modules from builder (includes all dependencies)
COPY --from=builder /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main"]
