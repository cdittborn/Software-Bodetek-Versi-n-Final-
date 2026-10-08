-- Aplica el plano de Fachadas v2 y el seed de las 69 fachadas.
-- UNA sesión: BEGIN → COMMIT. No usar salvo OK explícito.
-- No borra archivos ni intervenciones. Aborta si 20261008120000 ya está aplicada.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

do $$
begin
  if exists (
    select 1
    from supabase_migrations.schema_migrations
    where version = '20261008120000'
  ) then
    raise exception '20261008120000 ya está aplicada';
  end if;
end $$;

\ir ../supabase/migrations/20261008120000_fachadas_v2_plano.sql
\ir ../supabase/seed-fachadas-v2.sql

insert into supabase_migrations.schema_migrations (version, name, statements)
values (
  '20261008120000',
  'fachadas_v2_plano',
  array[
    '-- supabase/migrations/20261008120000_fachadas_v2_plano.sql',
    '-- supabase/seed-fachadas-v2.sql'
  ]
);

COMMIT;

notify pgrst, 'reload schema';
