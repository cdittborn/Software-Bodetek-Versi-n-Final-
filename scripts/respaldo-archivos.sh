#!/usr/bin/env bash
# Copia incremental del bucket de la app al bucket de respaldos (prefijo archivos/).
# LEE el bucket de la app (List/Get). ESCRIBE solo en bodetek-respaldos/archivos/.
# Nunca PutObject/DeleteObject al bucket de la app. Nunca --delete (no borra
# en el respaldo lo que se haya borrado en el origen).
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

SRC="s3://${APP_BUCKET}"
DEST="s3://${BACKUP_BUCKET}/archivos"

contar() {
  local uri="$1"
  aws s3 ls "$uri" --recursive --endpoint-url "$ENDPOINT" 2>/dev/null | wc -l | tr -d ' '
}

echo "→ objetos en app (${APP_BUCKET}): $(contar "$SRC")"
echo "→ sync SOLO LECTURA de ${SRC} → ESCRITURA en ${DEST} (sin --delete)"

# Origen primero, destino segundo. Sin --delete. El destino NUNCA es el bucket de la app.
# --copy-props none: R2 no implementa GetObjectTagging (AWS CLI lo pide por defecto).
aws s3 sync \
  "$SRC" \
  "$DEST" \
  --endpoint-url "$ENDPOINT" \
  --copy-props none \
  --no-progress \
  --only-show-errors

APP_N="$(contar "$SRC")"
BAK_N="$(contar "$DEST")"
echo "→ objetos en app (${APP_BUCKET}): ${APP_N}"
echo "→ objetos en respaldo (${BACKUP_BUCKET}/archivos/): ${BAK_N}"
echo "OK respaldo de archivos (incremental, sin borrar en destino ni en la app)"
