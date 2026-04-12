# Build context: services/ directory (parent of notifications/)
# This allows the shared/ module to be compiled into the service.

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy shared module first (build-time dependency)
COPY shared/ ./shared/

# Copy service source
COPY notifications/package*.json ./notifications/
WORKDIR /app/notifications
RUN npm ci

WORKDIR /app
COPY notifications/ ./notifications/

# Compile TypeScript (rootDir=../ so shared/ is in scope)
WORKDIR /app/notifications
RUN npx tsc --project tsconfig.json

# Stage 2: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/notifications/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/notifications/dist/ ./dist/

ENV PORT=8082
EXPOSE 8082
CMD ["node", "dist/notifications/src/index.js"]
