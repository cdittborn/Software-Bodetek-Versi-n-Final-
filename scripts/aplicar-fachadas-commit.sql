-- Aplica Fachadas en producción. UNA sesión: BEGIN → migración → COMMIT.
-- No usar salvo OK explícito.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

\ir ../supabase/migrations/20260924120000_fachadas.sql

-- Las migraciones aplicadas por supabase CLI quedan en este historial.
-- Las últimas aplicadas a mano (problemas / estado / materiales) no se
-- registraron; esta sí, para que `db push` no intente recrear las tablas.
insert into supabase_migrations.schema_migrations (version, name, statements)
values (
  '20260924120000',
  'fachadas',
  array[
    '-- supabase/migrations/20260924120000_fachadas.sql'
  ]
);

COMMIT;
