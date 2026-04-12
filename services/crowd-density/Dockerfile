# Build context: services/ directory (parent of crowd-density/)
# This allows the shared/ module to be compiled into the service.

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy shared module first (build-time dependency)
COPY shared/ ./shared/

# Copy service source
COPY crowd-density/package*.json ./crowd-density/
WORKDIR /app/crowd-density
RUN npm ci

WORKDIR /app
COPY crowd-density/ ./crowd-density/

# Compile TypeScript (rootDir=../ so shared/ is in scope)
WORKDIR /app/crowd-density
RUN npx tsc --project tsconfig.json

# Stage 2: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/crowd-density/package*.json ./
RUN npm ci --omit=dev

# Copy compiled output (dist/ includes shared/ compiled output)
COPY --from=builder /app/crowd-density/dist/ ./dist/

ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/crowd-density/src/index.js"]
