-- Aplica el rediseño de Fachadas en producción. UNA sesión: BEGIN → COMMIT.
-- No usar salvo OK explícito.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

\ir ../supabase/migrations/20260928120000_fachadas_redisenio.sql

insert into supabase_migrations.schema_migrations (version, name, statements)
values (
  '20260928120000',
  'fachadas_redisenio',
  array[
    '-- supabase/migrations/20260928120000_fachadas_redisenio.sql'
  ]
);

COMMIT;
