#!/bin/bash
# PriceHawk — Google Cloud Deployment Script
# This file demonstrates use of Google Cloud services and APIs

set -e

PROJECT_ID=${GCP_PROJECT_ID:-"your-project-id"}
REGION=${GCP_REGION:-"us-central1"}
BACKEND_IMAGE="gcr.io/$PROJECT_ID/pricehawk-backend"
FRONTEND_IMAGE="gcr.io/$PROJECT_ID/pricehawk-frontend"

echo "🦅 Deploying PriceHawk to Google Cloud..."

# ── Enable required GCP APIs ────────────────────────────────────────────────
gcloud services enable \
  run.googleapis.com \
  containerregistry.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  --project=$PROJECT_ID

# ── Create Firestore database ────────────────────────────────────────────────
gcloud firestore databases create \
  --region=$REGION \
  --project=$PROJECT_ID 2>/dev/null || echo "Firestore already exists"

# ── Store secrets in Secret Manager ─────────────────────────────────────────
gcloud secrets create gemini-api-key \
  --data-file=- <<< "$GEMINI_API_KEY" \
  --project=$PROJECT_ID 2>/dev/null || true

gcloud secrets create email-user \
  --data-file=- <<< "$EMAIL_USER" \
  --project=$PROJECT_ID 2>/dev/null || true

gcloud secrets create email-pass \
  --data-file=- <<< "$EMAIL_PASS" \
  --project=$PROJECT_ID 2>/dev/null || true

# ── Build & push backend Docker image ───────────────────────────────────────
echo "🐳 Building backend image..."
cd backend
docker build -t $BACKEND_IMAGE .
docker push $BACKEND_IMAGE

# ── Deploy backend to Cloud Run ──────────────────────────────────────────────
echo "🚀 Deploying backend to Cloud Run..."
gcloud run deploy pricehawk-api \
  --image=$BACKEND_IMAGE \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=2Gi \
  --cpu=2 \
  --timeout=300 \
  --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID" \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest,EMAIL_USER=email-user:latest,EMAIL_PASS=email-pass:latest" \
  --project=$PROJECT_ID

# ── Get backend URL ───────────────────────────────────────────────────────────
BACKEND_URL=$(gcloud run services describe pricehawk-api \
  --platform=managed \
  --region=$REGION \
  --format='value(status.url)' \
  --project=$PROJECT_ID)

echo "✅ Backend live at: $BACKEND_URL"

# ── Build & push frontend Docker image ──────────────────────────────────────
echo "🐳 Building frontend image..."
cd ../frontend
docker build --build-arg VITE_API_URL=$BACKEND_URL -t $FRONTEND_IMAGE .
docker push $FRONTEND_IMAGE

# ── Deploy frontend to Cloud Run ─────────────────────────────────────────────
echo "🚀 Deploying frontend to Cloud Run..."
gcloud run deploy pricehawk-frontend \
  --image=$FRONTEND_IMAGE \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=512Mi \
  --project=$PROJECT_ID

# ── Final output ──────────────────────────────────────────────────────────────
FRONTEND_URL=$(gcloud run services describe pricehawk-frontend \
  --platform=managed \
  --region=$REGION \
  --format='value(status.url)' \
  --project=$PROJECT_ID)

echo ""
echo "🎉 PriceHawk deployed successfully!"
echo "   Frontend : $FRONTEND_URL"
echo "   Backend  : $BACKEND_URL"
echo "   Firestore: https://console.cloud.google.com/firestore/data?project=$PROJECT_ID"