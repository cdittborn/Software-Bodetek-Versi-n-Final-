#!/usr/bin/env bash
# Dry-run: compras de materiales (tablas NUEVAS).
# UNA sesión: BEGIN → CREATE → verificar → ROLLBACK.
# Nunca ejecuta COMMIT.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL="$ROOT/scripts/dry-run-compras-materiales-rollback.sql"
PROD_REF="jzmlhgvmetljbpjguvoz"

URL="${SUPABASE_DB_URL:-${DATABASE_URL:-${DIRECT_URL:-}}}"
URL="${URL#"${URL%%[![:space:]]*}"}"
URL="${URL%"${URL##*[![:space:]]}"}"

if [[ -z "$URL" ]]; then
  echo "Falta la URI de Postgres de producción (SUPABASE_DB_URL o DATABASE_URL)." >&2
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

URL="$(URL="$URL" PROD_REF="$PROD_REF" python3 - <<'PY'
import os, socket, sys, urllib.parse
url = os.environ["URL"]
ref = os.environ["PROD_REF"]
p = urllib.parse.urlparse(url)
host = p.hostname or ""
print(
    "host_original:", host, "port_original:", p.port or "",
    file=sys.stderr,
)

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
    print(
        "rewritten_to_session_pooler:", pool_host, "port:5432", "user:", user,
        file=sys.stderr,
    )
print(url)
PY
)"

if grep -E '^[[:space:]]*COMMIT[[:space:]]*;' "$SQL"; then
  echo "ABORTADO: el SQL de dry-run contiene COMMIT." >&2
  exit 2
fi

if ! grep -qE '^[[:space:]]*ROLLBACK[[:space:]]*;' "$SQL"; then
  echo "ABORTADO: el SQL de dry-run no termina en ROLLBACK." >&2
  exit 2
fi

if ! command -v psql >/dev/null 2>/dev/null; then
  echo "Instalando postgresql-client…" >&2
  sudo apt-get update -qq
  sudo apt-get install -y -qq postgresql-client
fi

if [[ "$URL" != *"sslmode="* ]]; then
  if [[ "$URL" == *"?"* ]]; then
    URL="${URL}&sslmode=require"
  else
    URL="${URL}?sslmode=require"
  fi
fi

echo "→ Dry-run compras de materiales (BEGIN … ROLLBACK). Sin COMMIT."
echo

psql "$URL" \
  --set ON_ERROR_STOP=1 \
  --pset pager=off \
  --pset format=aligned \
  --echo-errors \
  -f "$SQL"

echo
echo "→ Chequeo post-ROLLBACK (las tablas NO deben existir todavía)…"
psql "$URL" --set ON_ERROR_STOP=1 --pset pager=off -c "
SELECT count(*)::int AS tablas_que_quedaron
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('compras_materiales', 'compra_material_trabajos');
"
