#!/usr/bin/env bash
# Copia incremental del bucket de la app al bucket de respaldos (prefijo archivos/).
# Agrega y actualiza. NUNCA borra en el destino lo que se haya borrado en el origen.
set -euo pipefail

ACCOUNT_ID="${R2_ACCOUNT_ID:-}"
APP_BUCKET="${R2_BUCKET_NAME:-}"
BACKUP_BUCKET="${R2_BACKUP_BUCKET:-}"
if [[ -z "$BACKUP_BUCKET" ]]; then
  BACKUP_BUCKET="bodetek-respaldos"
fi

if [[ -z "$ACCOUNT_ID" ]]; then
  echo "Falta R2_ACCOUNT_ID." >&2
  exit 1
fi
if [[ -z "$APP_BUCKET" ]]; then
  echo "Falta R2_BUCKET_NAME (bucket de la app)." >&2
  exit 1
fi
if [[ -z "${R2_ACCESS_KEY_ID:-}" || -z "${R2_SECRET_ACCESS_KEY:-}" ]]; then
  echo "Faltan R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY." >&2
  exit 1
fi
if [[ "$APP_BUCKET" == "$BACKUP_BUCKET" ]]; then
  echo "ABORTADO: el bucket de la app y el de respaldos no pueden ser el mismo." >&2
  exit 1
fi

ENDPOINT="https://${ACCOUNT_ID}.r2.cloudflarestorage.com"
export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION="auto"
export AWS_REQUEST_CHECKSUM_CALCULATION=WHEN_REQUIRED
export AWS_RESPONSE_CHECKSUM_VALIDATION=WHEN_REQUIRED

echo "→ sync incremental ${APP_BUCKET} → ${BACKUP_BUCKET}/archivos/ (sin --delete)"

aws s3 sync \
  "s3://${APP_BUCKET}" \
  "s3://${BACKUP_BUCKET}/archivos" \
  --endpoint-url "$ENDPOINT" \
  --no-progress \
  --only-show-errors

echo "OK respaldo de archivos (incremental, sin borrar en destino)"
