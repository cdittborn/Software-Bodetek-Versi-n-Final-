-- Aplica la galería de fotos y videos del estado actual en producción.
-- UNA sesión: BEGIN → COMMIT. No usar salvo OK explícito.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

\ir ../supabase/migrations/20261005120000_fachada_archivos.sql

insert into supabase_migrations.schema_migrations (version, name, statements)
values (
  '20261005120000',
  'fachada_archivos',
  array[
    '-- supabase/migrations/20261005120000_fachada_archivos.sql'
  ]
);

COMMIT;
