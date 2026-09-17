# =========================================================
# HRSDGDG Luxury Platform - Multi-stage Production Dockerfile
# =========================================================

# Stage 1: Build Frontend Applications
FROM node:20-alpine AS builder
WORKDIR /app

# 1. Build Admin Dashboard (/admin/)
COPY oria-admin/package*.json ./oria-admin/
RUN cd oria-admin && (npm ci || npm install)
COPY oria-admin ./oria-admin
RUN cd oria-admin && npm run build

# 2. Build Main Marketplace (/)
COPY oria-main/package*.json ./oria-main/
RUN cd oria-main && (npm ci || npm install)
COPY oria-main ./oria-main
RUN cd oria-main && npm run build

# =========================================================
# Stage 2: Unified Production Runner
# =========================================================
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=5077
ENV HOST=0.0.0.0

# Install production backend dependencies
COPY oria-api/package*.json ./oria-api/
RUN cd oria-api && (npm ci --omit=dev || npm install --omit=dev)

# Copy API backend source code
COPY oria-api ./oria-api

# Copy compiled frontend builds from builder stage
COPY --from=builder /app/oria-admin/dist ./oria-admin/dist
COPY --from=builder /app/oria-main/dist ./oria-main/dist

EXPOSE 5077

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://127.0.0.1:5077/api/categories || exit 1

CMD ["node", "oria-api/server.js"]
