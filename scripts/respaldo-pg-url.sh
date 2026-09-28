#!/usr/bin/env bash
# Reescribe la URI de Postgres de Supabase a IPv4 (session pooler) si hace falta.
# Imprime la URI en stdout. No loguear el resultado.
set -euo pipefail

PROD_REF="${PROD_REF:-jzmlhgvmetljbpjguvoz}"
URL="${1:-${SUPABASE_DB_URL:-${DATABASE_URL:-${DIRECT_URL:-}}}}"
URL="${URL#"${URL%%[![:space:]]*}"}"
URL="${URL%"${URL##*[![:space:]]}"}"

if [[ -z "$URL" ]]; then
  echo "Falta SUPABASE_DB_URL (URI de Postgres, modo Session, puerto 5432)." >&2
  exit 1
fi

if [[ "$URL" != postgres* ]]; then
  echo "ABORTADO: la URI debe ser postgres:// o postgresql://" >&2
  exit 1
fi

if [[ "$URL" != *"$PROD_REF"* ]]; then
  echo "ABORTADO: la URI no es del proyecto de producción ($PROD_REF)." >&2
  exit 1
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

printf '%s' "$URL"
