# Multi-stage Dockerfile for Global Auction Platform

FROM node:20-alpine AS base
# Install dependencies only when needed
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copy package files
COPY package*.json yarn.lock* ./

# Development stage
FROM base AS development
ENV NODE_ENV=development
RUN yarn install --frozen-lockfile
COPY . .
EXPOSE 3000 8083
CMD ["yarn", "dev"]

# Dependencies stage for production
FROM base AS deps
# Copy package files and Prisma schema for proper installation
COPY package*.json yarn.lock* ./
COPY prisma/ ./prisma/
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build environment variables
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Generate Prisma client
RUN npx prisma generate

# Build the application (with type checking disabled for production)
ENV NEXT_BUILD_IGNORE_TYPE_ERRORS=true
RUN yarn build

# Production image
FROM base AS production
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public

# Set permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create uploads directory
RUN mkdir -p ./uploads && chown nextjs:nodejs ./uploads

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]

# Worker stage for background jobs
FROM base AS worker
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker

USER worker

CMD ["node", "src/workers/main.js"]

# Scheduler stage for cron jobs
FROM base AS scheduler
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 scheduler

USER scheduler

CMD ["node", "src/schedulers/main.js"]