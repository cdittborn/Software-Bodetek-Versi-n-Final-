#!/usr/bin/env bash
# Aplica la migración de problemas en producción: BEGIN → migración → COMMIT.
# Después verifica en OTRA conexión (solo SELECT).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL="$ROOT/scripts/aplicar-migracion-problemas-commit.sql"
VERIFY="$ROOT/scripts/verificar-migracion-problemas.sql"
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
  exit 1
fi

if [[ "$URL" != *"$PROD_REF"* ]]; then
  echo "ABORTADO: la URI no contiene el ref de producción ($PROD_REF)." >&2
  exit 1
fi

if ! grep -qE '^[[:space:]]*COMMIT[[:space:]]*;' "$SQL"; then
  echo "ABORTADO: el SQL de aplicación no contiene COMMIT." >&2
  exit 2
fi

if grep -E '^[[:space:]]*ROLLBACK[[:space:]]*;' "$SQL"; then
  echo "ABORTADO: el SQL de aplicación contiene ROLLBACK." >&2
  exit 2
fi

URL="$(URL="$URL" PROD_REF="$PROD_REF" python3 - <<'PY'
import os, socket, sys, urllib.parse
url = os.environ["URL"]
ref = os.environ["PROD_REF"]
p = urllib.parse.urlparse(url)
host = p.hostname or ""

def has_ipv4(h, port=5432):
    try:
        socket.getaddrinfo(h, port, socket.AF_INET, socket.SOCK_STREAM)
        return True
    except OSError:
        return False

if host.startswith("db.") and host.endswith(".supabase.co") and not has_ipv4(host, p.port or 5432):
    pool_host = "aws-1-sa-east-1.pooler.supabase.com"
    user = p.username or "postgres"
    if user == "postgres":
        user = f"postgres.{ref}"
    password = urllib.parse.unquote(p.password or "")
    netloc = f"{urllib.parse.quote(user, safe='')}:{urllib.parse.quote(password, safe='')}@{pool_host}:5432"
    url = urllib.parse.urlunparse(("postgresql", netloc, p.path or "/postgres", "", "sslmode=require", ""))
    print("rewritten_to_session_pooler:", pool_host, file=sys.stderr)
print(url)
PY
)"

if [[ "$URL" != *"sslmode="* ]]; then
  if [[ "$URL" == *"?"* ]]; then
    URL="${URL}&sslmode=require"
  else
    URL="${URL}?sslmode=require"
  fi
fi

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
  -c "SELECT
        EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='trabajos' AND column_name='problemas'
        ) AS columna_problemas_existe,
        (SELECT count(*)::int FROM public.trabajos WHERE evento_id IS NOT NULL) AS total_filtraciones,
        (SELECT count(*)::int FROM public.trabajos WHERE evento_id IS NOT NULL AND problemas IS NOT NULL) AS filas_con_json;"

echo
psql "$URL" \
  --set ON_ERROR_STOP=1 \
  --pset pager=off \
  --pset format=aligned \
  -f "$VERIFY"
