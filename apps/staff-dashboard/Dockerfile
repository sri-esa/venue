# Stage 1 — Build the React/Vite app
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./

# Delete the Windows-generated lock file so npm resolves platform-native
# binaries (e.g. @rollup/rollup-linux-x64-musl) correctly on Alpine Linux.
# See: https://github.com/npm/cli/issues/4828
RUN rm -f package-lock.json && npm install

COPY . .

# Inject Vite env vars at build time
ARG VITE_GCP_API_KEY
ARG VITE_FCM_VAPID_KEY
ARG VITE_MAPS_API_KEY

RUN VITE_GCP_API_KEY=$VITE_GCP_API_KEY \
    VITE_FCM_VAPID_KEY=$VITE_FCM_VAPID_KEY \
    VITE_MAPS_API_KEY=$VITE_MAPS_API_KEY \
    npm run build

# Stage 2 — Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Cloud Run requires port 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
