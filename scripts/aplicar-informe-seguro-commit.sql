-- Aplica el informe para seguro en producción.
-- UNA sesión: BEGIN → COMMIT. El rollback va en otro archivo y no se ejecuta aquí.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

do $$
begin
  if exists (
    select 1 from supabase_migrations.schema_migrations
    where version = '20261006120000'
  ) then
    raise exception '20261006120000 ya está aplicada';
  end if;
end $$;

\ir ../supabase/migrations/20261006120000_informe_seguro.sql

insert into supabase_migrations.schema_migrations (version, name, statements)
values (
  '20261006120000',
  'informe_seguro',
  array[
    '-- supabase/migrations/20261006120000_informe_seguro.sql'
  ]
);

COMMIT;

notify pgrst, 'reload schema';
