-- Rollback de 20261104120000. NO ejecutar sin un OK aparte.
-- Quita la tabla, la marca y las políticas nuevas. No borra trabajos ni fotos.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

\ir ../supabase/rollback/20261104120000_usuario_visibilidad_down.sql

delete from supabase_migrations.schema_migrations
where version = '20261104120000';

COMMIT;

notify pgrst, 'reload schema';
