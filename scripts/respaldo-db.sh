#!/usr/bin/env bash
# Dump schema+datos de public y auth → gzip → R2 privado db/AAAA-MM-DD.sql.gz
# Conserva 30 días. Nunca escribe el dump en el repo.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROD_REF="${PROD_REF:-jzmlhgvmetljbpjguvoz}"
MIN_BYTES="${MIN_DUMP_BYTES:-10000}"
KEEP_DAYS="${KEEP_DAYS:-30}"
BACKUP_BUCKET="${R2_BACKUP_BUCKET:-}"
if [[ -z "$BACKUP_BUCKET" ]]; then
  BACKUP_BUCKET="bodetek-respaldos"
fi
ACCOUNT_ID="${R2_ACCOUNT_ID:-}"
PREFIX="db"

if [[ -z "$ACCOUNT_ID" ]]; then
  echo "Falta R2_ACCOUNT_ID." >&2
  exit 1
fi
if [[ -z "${R2_ACCESS_KEY_ID:-}" || -z "${R2_SECRET_ACCESS_KEY:-}" ]]; then
  echo "Faltan R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY." >&2
  exit 1
fi

export TZ="${TZ:-America/Santiago}"
DIA="$(date +%F)"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT
DUMP_SQL="$WORKDIR/bodetek-${DIA}.sql"
DUMP_GZ="$WORKDIR/bodetek-${DIA}.sql.gz"

URL="$("$ROOT/scripts/respaldo-pg-url.sh")"

echo "→ pg_dump public + auth ($DIA, hora Chile $(date +%H:%M))"

# pg_dump más nuevo que el servidor está bien. La imagen 17 cubre Supabase actual.
docker run --rm \
  -e "PGDUMP_URL=$URL" \
  postgres:17-alpine \
  sh -c 'pg_dump \
    --dbname="$PGDUMP_URL" \
    --schema=public \
    --schema=auth \
    --no-owner \
    --no-acl \
    --encoding=UTF8 \
    --format=plain' \
  > "$DUMP_SQL"

if [[ ! -s "$DUMP_SQL" ]]; then
  echo "FALLO: el dump está vacío." >&2
  exit 1
fi

gzip -9 -c "$DUMP_SQL" > "$DUMP_GZ"
BYTES="$(wc -c < "$DUMP_GZ" | tr -d ' ')"
echo "→ gzip: ${BYTES} bytes"

if [[ "$BYTES" -lt "$MIN_BYTES" ]]; then
  echo "FALLO: el dump comprimido pesa ${BYTES} bytes (mínimo ${MIN_BYTES})." >&2
  exit 1
fi

faltan=()
for tabla in eventos trabajos trabajo_media; do
  if ! grep -Eq "CREATE TABLE public\.${tabla}([[:space:]]|\()" "$DUMP_SQL"; then
    faltan+=("$tabla")
  fi
done
if [[ ${#faltan[@]} -gt 0 ]]; then
  echo "FALLO: no aparecen en el dump las tablas: ${faltan[*]}" >&2
  exit 1
fi
echo "→ tablas eventos, trabajos y trabajo_media presentes"

ENDPOINT="https://${ACCOUNT_ID}.r2.cloudflarestorage.com"
export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION="auto"
export AWS_REQUEST_CHECKSUM_CALCULATION=WHEN_REQUIRED
export AWS_RESPONSE_CHECKSUM_VALIDATION=WHEN_REQUIRED

DEST="s3://${BACKUP_BUCKET}/${PREFIX}/${DIA}.sql.gz"
echo "→ subiendo a ${BACKUP_BUCKET}/${PREFIX}/${DIA}.sql.gz"

aws s3 cp "$DUMP_GZ" "$DEST" \
  --endpoint-url "$ENDPOINT" \
  --only-show-errors

echo "→ purgando dumps de más de ${KEEP_DAYS} días"
CUTOFF="$(date -d "-${KEEP_DAYS} days" +%F 2>/dev/null || python3 - <<PY
from datetime import date, timedelta
print((date.today() - timedelta(days=int("${KEEP_DAYS}"))).isoformat())
PY
)"

aws s3 ls "s3://${BACKUP_BUCKET}/${PREFIX}/" --endpoint-url "$ENDPOINT" \
  | awk '{print $4}' \
  | while read -r name; do
      [[ "$name" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}\.sql\.gz$ ]] || continue
      dia="${name%.sql.gz}"
      if [[ "$dia" < "$CUTOFF" ]]; then
        echo "  borrando ${PREFIX}/${name} (anterior a ${CUTOFF})"
        aws s3 rm "s3://${BACKUP_BUCKET}/${PREFIX}/${name}" --endpoint-url "$ENDPOINT"
      fi
    done

echo "OK respaldo DB ${DIA} (${BYTES} bytes gzip)"
