# =========================================================
# Stage 1: Build Frontend Applications (oria-admin & oria-main)
# =========================================================
FROM node:20-alpine AS builder
WORKDIR /app

# 1. Build Admin Dashboard (/admin/)
COPY oria-admin/package*.json ./oria-admin/
RUN cd oria-admin && npm ci
COPY oria-admin ./oria-admin
RUN cd oria-admin && npm run build

# 2. Build Main Marketplace (/)
COPY oria-main/package*.json ./oria-main/
RUN cd oria-main && npm ci
COPY oria-main ./oria-main
RUN cd oria-main && npm run build

# =========================================================
# Stage 2: Unified Production Server
# =========================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5077
ENV HOST=0.0.0.0

# Install production backend dependencies
COPY oria-api/package*.json ./oria-api/
RUN cd oria-api && npm ci --omit=dev

# Copy API backend source code and initial database
COPY oria-api ./oria-api

# Copy compiled frontend builds from builder stage
COPY --from=builder /app/oria-admin/dist ./oria-admin/dist
COPY --from=builder /app/oria-main/dist ./oria-main/dist

# Expose port
EXPOSE 5077

# Start unified server
CMD ["node", "oria-api/server.js"]
