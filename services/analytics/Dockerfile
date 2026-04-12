# Build context: services/ directory (parent of analytics/)
# This allows the shared/ module to be compiled into the service.

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy shared module first (build-time dependency)
COPY shared/ ./shared/

# Copy service source
COPY analytics/package*.json ./analytics/
WORKDIR /app/analytics
RUN npm ci

WORKDIR /app
COPY analytics/ ./analytics/

# Compile TypeScript (rootDir=../ so shared/ is in scope)
WORKDIR /app/analytics
RUN npx tsc --project tsconfig.json

# Stage 2: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/analytics/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/analytics/dist/ ./dist/

ENV PORT=8083
EXPOSE 8083
CMD ["node", "dist/analytics/src/index.js"]
