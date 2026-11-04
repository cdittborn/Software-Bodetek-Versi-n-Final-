#!/usr/bin/env bash
# Aplica la visibilidad por persona (20261104120000) en producción: BEGIN … COMMIT.
# NO ejecutar salvo OK explícito. Antes: respaldo de la base del día.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL="$ROOT/scripts/aplicar-usuario-visibilidad-commit.sql"
VERIFY="$ROOT/scripts/verificar-usuario-visibilidad.sql"
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

URL="$(URL="$URL" PROD_REF="$PROD_REF" python3 - <<'PY'
import os, socket, urllib.parse
url = os.environ["URL"]
ref = os.environ["PROD_REF"]
p = urllib.parse.urlparse(url)
host = p.hostname or ""

def has_ipv4(h, port=5432):
    try:
        socket.getaddrinfo(h, port, socket.AF_INET, socket.SOCK_STREAM)
    except OSError:
        return False
    return True

if host.startswith("db.") and host.endswith(".supabase.co") and not has_ipv4(host, p.port or 5432):
    pool_host = "aws-1-sa-east-1.pooler.supabase.com"
    user = p.username or "postgres"
    if user == "postgres":
        user = f"postgres.{ref}"
    password = urllib.parse.unquote(p.password or "")
    netloc = f"{urllib.parse.quote(user, safe='')}:{urllib.parse.quote(password, safe='')}@{pool_host}:5432"
    url = urllib.parse.urlunparse(("postgresql", netloc, p.path or "/postgres", "", "sslmode=require", ""))
    print("rewritten_to_session_pooler:", pool_host, file=__import__("sys").stderr)
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

if ! command -v psql >/dev/null 2>&1; then
  echo "Instalando postgresql-client…" >&2
  sudo apt-get update -qq
  sudo apt-get install -y -qq postgresql-client
fi

CONTEOS="$ROOT/scripts/conteos-public.sql"
ANTES="$(mktemp)"
DESPUES="$(mktemp)"
trap 'rm -f "$ANTES" "$DESPUES"' EXIT

echo "→ Conteos antes (conexión de solo lectura)…"
psql "$URL" --set ON_ERROR_STOP=1 -X -At -f "$CONTEOS" > "$ANTES"
cat "$ANTES"

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

echo
echo "→ Conteos después (conexión NUEVA, solo lectura)…"
psql "$URL" --set ON_ERROR_STOP=1 -X -At -f "$CONTEOS" > "$DESPUES"
if ! diff -u "$ANTES" "$DESPUES"; then
  echo "ATENCIÓN: cambió la cantidad de filas de alguna tabla." >&2
  exit 3
fi
echo "Conteos iguales en todas las tablas."
