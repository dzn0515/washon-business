#!/usr/bin/env bash
# washon-business — Cloud Run deploy script (manual execution only)
#
# Prerequisites:
#   gcloud auth login
#   gcloud config set project PROJECT_ID
#   Artifact Registry repo created: washon-business (asia-northeast3)
#
# First-time setup (run once):
#   chmod +x scripts/deploy-cloudrun.sh
#
# Usage:
#   ./scripts/deploy-cloudrun.sh
#
# Environment overrides:
#   PROJECT_ID=sellem-auto-prod REGION=asia-northeast3 ./scripts/deploy-cloudrun.sh

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${REGION:-asia-northeast3}"
SERVICE_NAME="${SERVICE_NAME:-washon-business}"
REPOSITORY="${REPOSITORY:-washon-business}"
IMAGE="${IMAGE:-washon-business}"
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://api.autoon.kr/api/v1}"
NEXT_PUBLIC_USE_MOCK="${NEXT_PUBLIC_USE_MOCK:-false}"

if [[ -z "${PROJECT_ID}" || "${PROJECT_ID}" == "(unset)" ]]; then
  echo "ERROR: PROJECT_ID is not set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE}"

echo "==> Project:  ${PROJECT_ID}"
echo "==> Region:   ${REGION}"
echo "==> Service:  ${SERVICE_NAME}"
echo "==> Image:    ${IMAGE_URI}"
echo ""

echo "==> [1/3] Cloud Build — build & push image"
gcloud builds submit \
  --project="${PROJECT_ID}" \
  --config=cloudbuild.yaml \
  --substitutions="_REGION=${REGION},_REPOSITORY=${REPOSITORY},_IMAGE=${IMAGE},_NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL},_NEXT_PUBLIC_USE_MOCK=${NEXT_PUBLIC_USE_MOCK}"

echo ""
echo "==> [2/3] Cloud Run — deploy service"
gcloud run deploy "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --image="${IMAGE_URI}:latest" \
  --region="${REGION}" \
  --platform=managed \
  --port=8080 \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL},NEXT_PUBLIC_USE_MOCK=${NEXT_PUBLIC_USE_MOCK}"

echo ""
echo "==> [3/3] Service URL"
gcloud run services describe "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --format='value(status.url)'

echo ""
echo "Done. Test the URL above before switching business.autoon.kr DNS."
