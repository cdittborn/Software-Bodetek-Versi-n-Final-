-- Dry-run: tablas nuevas de compras de materiales.
-- BEGIN → CREATE → verificar en la transacción → ROLLBACK.
-- No COMMIT. No toca tablas existentes con datos.

BEGIN;

\ir ../supabase/migrations/20260901233000_compras_materiales.sql

\echo ''
\echo '========== tablas creadas (en la transacción) =========='
SELECT c.relname AS tabla, c.relrowsecurity AS rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('compras_materiales', 'compra_material_trabajos')
ORDER BY 1;

\echo ''
\echo '========== columnas compras_materiales =========='
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'compras_materiales'
ORDER BY ordinal_position;

\echo ''
\echo '========== policies =========='
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('compras_materiales', 'compra_material_trabajos')
ORDER BY 1, 2;

\echo ''
\echo '========== trigger mismo evento =========='
SELECT tgname
FROM pg_trigger
WHERE tgrelid = 'public.compra_material_trabajos'::regclass
  AND NOT tgisinternal;

ROLLBACK;
