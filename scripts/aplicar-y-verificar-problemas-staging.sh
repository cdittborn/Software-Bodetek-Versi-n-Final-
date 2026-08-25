#!/usr/bin/env bash
# Aplica SOLO la migración de problemas en STAGING y corre la verificación de texto.
#
# Requisitos (URI de Database settings → Connection string → URI, modo Session):
#   export STAGING_SUPABASE_DB_URL='postgresql://postgres:...@db.<project-ref>.supabase.co:5432/postgres'
#
# Rechaza el proyecto de producción conocido (jzmlhgvmetljbpjguvoz).
# No hay flag de producción a propósito.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATION="$ROOT/supabase/migrations/20260825190000_filtracion_problemas.sql"
VERIFY="$ROOT/scripts/verificar-migracion-problemas.sql"
MUESTRA="$ROOT/scripts/verificar-migracion-problemas-muestra.sql"
PROD_REF="jzmlhgvmetljbpjguvoz"

if [[ -z "${STAGING_SUPABASE_DB_URL:-}" ]]; then
  echo "Falta STAGING_SUPABASE_DB_URL (connection string de STAGING, no producción)." >&2
  exit 1
fi

if [[ "$STAGING_SUPABASE_DB_URL" == *"$PROD_REF"* ]]; then
  echo "ABORTADO: la URL apunta al proyecto de producción ($PROD_REF)." >&2
  exit 1
fi

if [[ "$STAGING_SUPABASE_DB_URL" != postgres* ]]; then
  echo "ABORTADO: STAGING_SUPABASE_DB_URL debe ser una URI postgres:// o postgresql://" >&2
  exit 1
fi

echo "→ Aplicando $MIGRATION en staging…"
npx supabase db query --db-url "$STAGING_SUPABASE_DB_URL" -f "$MIGRATION"

echo
echo "→ Verificación (conteos / PASS-FAIL)…"
npx supabase db query --db-url "$STAGING_SUPABASE_DB_URL" -f "$VERIFY"

echo
echo "→ Muestra de texto antes vs. después (hasta 15 filas)…"
npx supabase db query --db-url "$STAGING_SUPABASE_DB_URL" -f "$MUESTRA"

echo
echo "Interpretación: PASS si filas_texto_no_coincide=0 y con_texto_sin_json=0."
echo "techumbre_activo_default es un valor por defecto, no una clasificación real."
