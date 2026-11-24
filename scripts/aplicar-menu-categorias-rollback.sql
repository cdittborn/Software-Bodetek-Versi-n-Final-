-- Deshace el menú editable (20261103230000). UNA sesión: BEGIN → COMMIT.
-- No ejecutar salvo OK explícito, y solo junto con el código anterior a la fase 2.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

\ir ../supabase/rollback/20261103230000_menu_categorias_down.sql

delete from supabase_migrations.schema_migrations where version = '20261103230000';

COMMIT;

notify pgrst, 'reload schema';
