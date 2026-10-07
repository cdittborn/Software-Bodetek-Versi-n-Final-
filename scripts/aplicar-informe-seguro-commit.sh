#!/usr/bin/env bash
# Aplica el informe para seguro en producción: BEGIN … COMMIT.
# NO ejecutar salvo OK explícito.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL="$ROOT/scripts/aplicar-informe-seguro-commit.sql"
VERIFY="$ROOT/scripts/verificar-informe-seguro.sql"
PROD_REF="jzmlhgvmetljbpjguvoz"

URL="${SUPABASE_DB_URL:-${DATABASE_URL:-${DIRECT_URL:-}}}"
URL="${URL#"${URL%%[![:space:]]*}"}"
URL="${URL%"${URL##*[![:space:]]}"}"

if [[ -z "$URL" ]]; then
  echo "Falta SUPABASE_DB_URL." >&2
  exit 1
fi

if [[ "$URL" != postgres* ]]; then
  echo "ABORTADO: la URI debe ser postgres:// o postgresql://" >&2
  exit 2
fi

if [[ "$URL" != *"$PROD_REF"* ]]; then
  echo "ABORTADO: la URI no contiene el ref de producción ($PROD_REF)." >&2
  exit 2
fi

if ! grep -qE '^[[:space:]]*COMMIT[[:space:]]*;' "$SQL"; then
  echo "ABORTADO: el SQL de aplicación no contiene COMMIT." >&2
  exit 2
fi

if grep -E '^[[:space:]]*ROLLBACK[[:space:]]*;' "$SQL"; then
  echo "ABORTADO: el SQL de aplicación contiene ROLLBACK." >&2
  exit 2
fi

URL="$(bash "$ROOT/scripts/respaldo-pg-url.sh")"

if ! command -v psql >/dev/null 2>&1; then
  echo "Instalando postgresql-client…" >&2
  sudo apt-get update -qq
  sudo apt-get install -y -qq postgresql-client
fi

echo "→ Baseline (conexión de solo lectura)…"
psql "$URL" \
  --set ON_ERROR_STOP=1 \
  --pset pager=off \
  --pset format=aligned \
  -f "$ROOT/scripts/baseline-informe-seguro.sql"

echo
echo "→ Aplicando en UNA sesión: BEGIN … COMMIT."
echo

psql "$URL" \
  --set ON_ERROR_STOP=1 \
  --pset pager=off \
  --pset format=aligned \
  --echo-errors \
  -f "$SQL"

echo
echo "→ Verificación final (conexión NUEVA, solo SELECT)…"
psql "$URL" \
  --set ON_ERROR_STOP=1 \
  --pset pager=off \
  --pset format=aligned \
  -f "$VERIFY"
