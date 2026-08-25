#!/usr/bin/env bash
# Dry-run de la migración de problemas contra Postgres (producción).
# UNA sola sesión: BEGIN → migración → verificación → ROLLBACK.
# Nunca pasa --single-transaction (eso haría COMMIT).
# Nunca ejecuta COMMIT.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL="$ROOT/scripts/dry-run-migracion-problemas-rollback.sql"
PROD_REF="jzmlhgvmetljbpjguvoz"

URL="${SUPABASE_DB_URL:-${DATABASE_URL:-${DIRECT_URL:-}}}"

if [[ -z "$URL" ]]; then
  echo "Falta la URI de Postgres de producción (SUPABASE_DB_URL o DATABASE_URL)." >&2
  echo "No sirve NEXT_PUBLIC_SUPABASE_URL ni la service_role: no pueden hacer BEGIN/ROLLBACK." >&2
  echo "En Dashboard → Project Settings → Database → Connection string → URI, modo Session (puerto 5432)." >&2
  exit 1
fi

if [[ "$URL" != postgres* ]]; then
  echo "ABORTADO: la URI debe ser postgres:// o postgresql://" >&2
  exit 1
fi

if [[ "$URL" != *"$PROD_REF"* ]]; then
  echo "ABORTADO: la URI no contiene el ref de producción ($PROD_REF). No corro el dry-run contra otro proyecto." >&2
  exit 1
fi

if grep -E '^[[:space:]]*COMMIT[[:space:]]*;' "$SQL"; then
  echo "ABORTADO: el SQL de dry-run contiene COMMIT." >&2
  exit 2
fi

if ! grep -qE '^[[:space:]]*ROLLBACK[[:space:]]*;' "$SQL"; then
  echo "ABORTADO: el SQL de dry-run no termina en ROLLBACK." >&2
  exit 2
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "Instalando postgresql-client…" >&2
  sudo apt-get update -qq
  sudo apt-get install -y -qq postgresql-client
fi

# Forzar SSL si la URI de Supabase no lo trae.
if [[ "$URL" != *"sslmode="* ]]; then
  if [[ "$URL" == *"?"* ]]; then
    URL="${URL}&sslmode=require"
  else
    URL="${URL}?sslmode=require"
  fi
fi

echo "→ Dry-run en UNA sesión (BEGIN … ROLLBACK). Sin COMMIT."
echo

psql "$URL" \
  --set ON_ERROR_STOP=1 \
  --pset pager=off \
  --pset format=aligned \
  --echo-errors \
  -f "$SQL"

echo
echo "→ Chequeo post-ROLLBACK (otra conexión, solo SELECT)…"
EXISTE="$(psql "$URL" --set ON_ERROR_STOP=1 -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trabajos' AND column_name='problemas');")"
echo "columna_problemas_existe_despues: $EXISTE"
if [[ "$EXISTE" == t ]]; then
  psql "$URL" --set ON_ERROR_STOP=1 --pset pager=off \
    -c "SELECT count(*)::int AS filas_con_json_despues FROM public.trabajos WHERE evento_id IS NOT NULL AND problemas IS NOT NULL;"
else
  echo "filas_con_json_despues: columna no existe (el ADD COLUMN también se revirtió)."
fi
