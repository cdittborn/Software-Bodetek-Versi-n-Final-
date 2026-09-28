-- Aplica medidas opcionales de Fachadas en producción.
-- UNA sesión: BEGIN → COMMIT. No usar salvo OK explícito.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

\ir ../supabase/migrations/20260928210000_fachadas_m2_nullable.sql

insert into supabase_migrations.schema_migrations (version, name, statements)
values (
  '20260928210000',
  'fachadas_m2_nullable',
  array[
    '-- supabase/migrations/20260928210000_fachadas_m2_nullable.sql'
  ]
);

COMMIT;
