-- Aplica fechas base (última limpieza/reparación/pintura) en producción.
-- UNA sesión: BEGIN → COMMIT. No usar salvo OK explícito.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

\ir ../supabase/migrations/20260928200000_fachadas_fechas_base.sql

insert into supabase_migrations.schema_migrations (version, name, statements)
values (
  '20260928200000',
  'fachadas_fechas_base',
  array[
    '-- supabase/migrations/20260928200000_fachadas_fechas_base.sql'
  ]
);

COMMIT;
