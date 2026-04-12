#!/bin/bash
# ============================================================
# Smart Venue — Cloud Run Deployment Script
# Project: crowd-management-system-492802
# Region:  us-central1
# ============================================================
set -e

PROJECT_ID="crowd-management-system-492802"
REGION="us-central1"
REGISTRY="gcr.io/$PROJECT_ID"

SERVICES=("crowd-density" "queue-management" "analytics" "notifications")

echo "🚀  Starting Cloud Run deployment for project: $PROJECT_ID"
echo ""

# ─── Step 1: Authenticate & set project ──────────────────
gcloud config set project $PROJECT_ID

# ─── Step 2: Enable required APIs (idempotent) ───────────
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  firestore.googleapis.com \
  pubsub.googleapis.com \
  --project $PROJECT_ID

echo "✅  APIs enabled"
echo ""

# ─── Step 3: Build & push each service ───────────────────
for SERVICE in "${SERVICES[@]}"; do
  echo "──────────────────────────────────────────────"
  echo "🔨  Building service: $SERVICE"
  echo "──────────────────────────────────────────────"

  SERVICE_DIR="services/$SERVICE"
  IMAGE="$REGISTRY/$SERVICE:latest"

  # Build TypeScript first
  echo "   → Compiling TypeScript..."
  (cd $SERVICE_DIR && npm ci && npm run build)

  # Build & push Docker image
  echo "   → Building Docker image: $IMAGE"
  docker build -t $IMAGE $SERVICE_DIR

  echo "   → Pushing to Container Registry..."
  docker push $IMAGE

  echo "✅  $SERVICE image pushed: $IMAGE"
  echo ""
done

# ─── Step 4: Deploy each service to Cloud Run ────────────
echo "──────────────────────────────────────────────"
echo "⬆️   Deploying to Cloud Run..."
echo "──────────────────────────────────────────────"

deploy_service() {
  local SERVICE=$1
  local PORT=$2
  local IMAGE="$REGISTRY/$SERVICE:latest"

  echo ""
  echo "🚀  Deploying: $SERVICE (port $PORT)"

  gcloud run deploy $SERVICE \
    --image $IMAGE \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port $PORT \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 5 \
    --set-env-vars "PROJECT_ID=$PROJECT_ID,GCP_PROJECT_ID=$PROJECT_ID,NODE_ENV=production" \
    --project $PROJECT_ID

  echo "✅  $SERVICE deployed"
}

deploy_service "crowd-density"   8080
deploy_service "queue-management" 8080
deploy_service "analytics"       8080
deploy_service "notifications"   8082

echo ""
echo "══════════════════════════════════════════════"
echo "🎉  All services deployed!"
echo ""
echo "Service URLs:"
for SERVICE in "${SERVICES[@]}"; do
  URL=$(gcloud run services describe $SERVICE \
    --region $REGION \
    --project $PROJECT_ID \
    --format 'value(status.url)' 2>/dev/null || echo "  (check GCP console)")
  echo "  $SERVICE → $URL"
done
echo "══════════════════════════════════════════════"
