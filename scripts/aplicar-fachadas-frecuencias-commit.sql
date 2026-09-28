-- Aplica frecuencias por tipo en producción. UNA sesión: BEGIN → COMMIT.
-- No usar salvo OK explícito.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

\ir ../supabase/migrations/20260928180000_fachadas_frecuencias_tipo.sql

insert into supabase_migrations.schema_migrations (version, name, statements)
values (
  '20260928180000',
  'fachadas_frecuencias_tipo',
  array[
    '-- supabase/migrations/20260928180000_fachadas_frecuencias_tipo.sql'
  ]
);

COMMIT;
