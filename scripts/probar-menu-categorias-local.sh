#!/usr/bin/env bash
# Prueba la migración 20261103230000 en una base PostgreSQL LOCAL desechable.
# Nunca usa SUPABASE_DB_URL. Requiere un servidor local (sudo -u postgres).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB="bodetek_menu_prueba"

unset PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE DATABASE_URL SUPABASE_DB_URL DIRECT_URL

sudo -u postgres dropdb --if-exists "$DB"
sudo -u postgres createdb "$DB"
cd "$ROOT/scripts"
sudo -u postgres psql -X -d "$DB" --set ON_ERROR_STOP=1 --pset pager=off -f probar-menu-categorias-local.sql
sudo -u postgres dropdb "$DB"
