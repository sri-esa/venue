param(
  [string]$ProjectId = "crowd-management-system-492802",
  [string]$Region = "us-central1",
  [string]$Service = "staff-dashboard",
  [string]$Repository = "gcr.io"
)

$ErrorActionPreference = "Stop"

if (-not $env:GCP_API_KEY) {
  throw "Missing required environment variable: GCP_API_KEY"
}

if (-not $env:FCM_VAPID_KEY) {
  throw "Missing required environment variable: FCM_VAPID_KEY"
}

if (-not $env:MAPS_API_KEY) {
  throw "Missing required environment variable: MAPS_API_KEY"
}

if (-not $env:GEMINI_API_KEY) {
  throw "Missing required environment variable: GEMINI_API_KEY"
}

$ImageUri = if ($Repository -eq "gcr.io") {
  "gcr.io/$ProjectId/$Service`:latest"
} else {
  "$Region-docker.pkg.dev/$ProjectId/$Repository/$Service`:latest"
}

Write-Host "Project: $ProjectId"
Write-Host "Region: $Region"
Write-Host "Service: $Service"
Write-Host "Repository: $Repository"
Write-Host "Image: $ImageUri"

gcloud config set project $ProjectId

gcloud builds submit `
  --config cloudbuild.yaml `
  --substitutions "_SERVICE=$Service,_REGION=$Region,_IMAGE_URI=$ImageUri,_VITE_GCP_API_KEY=$($env:GCP_API_KEY),_VITE_FCM_VAPID_KEY=$($env:FCM_VAPID_KEY),_VITE_MAPS_API_KEY=$($env:MAPS_API_KEY),_VITE_GEMINI_API_KEY=$($env:GEMINI_API_KEY)"

Write-Host ""
Write-Host "Cloud Run URL:"
gcloud run services describe $Service --region $Region --format="value(status.url)"
