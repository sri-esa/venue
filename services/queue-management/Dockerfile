# Build context: services/ directory (parent of queue-management/)
# This allows the shared/ module to be compiled into the service.

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy shared module first (build-time dependency)
COPY shared/ ./shared/

# Copy service source
COPY queue-management/package*.json ./queue-management/
WORKDIR /app/queue-management
RUN npm ci

WORKDIR /app
COPY queue-management/ ./queue-management/

# Compile TypeScript (rootDir=../ so shared/ is in scope)
WORKDIR /app/queue-management
RUN npx tsc --project tsconfig.json

# Stage 2: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/queue-management/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/queue-management/dist/ ./dist/

ENV PORT=8081
EXPOSE 8081
CMD ["node", "dist/queue-management/src/index.js"]
