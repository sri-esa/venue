#!/bin/bash
# Implements Phase 2 Architecture Deployment Strategy

# Load environment variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "Running Pre-Deployment Regression Suite..."
bash tests/regression/run_regression.sh
if [ $? -ne 0 ]; then
  echo "Regression suite failed! Blocking deployment."
  exit 1
fi

PROJECT="${PROD_PROJECT_ID:-smart-venue-dev}"
REGION="${CLOUD_RUN_REGION:-asia-south1}"

echo "Building and deploying Crowd Intelligence services to Google Cloud Run..."

docker build -t gcr.io/$PROJECT/crowd-density ./services/crowd-density
docker build -t gcr.io/$PROJECT/queue-management ./services/queue-management
docker build -t gcr.io/$PROJECT/notifications ./services/notifications
docker build -t gcr.io/$PROJECT/analytics ./services/analytics

docker push gcr.io/$PROJECT/crowd-density
docker push gcr.io/$PROJECT/queue-management
docker push gcr.io/$PROJECT/notifications
docker push gcr.io/$PROJECT/analytics

gcloud run deploy crowd-density-service \
  --image gcr.io/$PROJECT/crowd-density \
  --region $REGION \
  --min-instances 2 \
  --max-instances 20 \
  --concurrency 100 \
  --memory 512Mi \
  --set-env-vars PROJECT_ID=$PROJECT

gcloud run deploy queue-management-service \
  --image gcr.io/$PROJECT/queue-management \
  --region $REGION \
  --min-instances 2 \
  --max-instances 20 \
  --concurrency 100 \
  --memory 512Mi \
  --set-env-vars PROJECT_ID=$PROJECT

gcloud run deploy notifications-service \
  --image gcr.io/$PROJECT/notifications \
  --region $REGION \
  --min-instances 1 \
  --max-instances 10 \
  --concurrency 100 \
  --memory 256Mi \
  --set-env-vars PROJECT_ID=$PROJECT

gcloud run deploy analytics-service \
  --image gcr.io/$PROJECT/analytics \
  --region $REGION \
  --min-instances 1 \
  --max-instances 5 \
  --concurrency 50 \
  --memory 512Mi \
  --set-env-vars PROJECT_ID=$PROJECT

echo "All backend services deployed."

echo "Deploying Staff Dashboard..."

cd apps/staff-dashboard
npm run build
firebase deploy --only hosting:staff-dashboard

echo "Deployment complete."
