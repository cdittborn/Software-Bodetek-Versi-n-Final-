-- Agrega la validación por recinto. UNA sesión: BEGIN → COMMIT.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

do $$
begin
  if exists (
    select 1 from supabase_migrations.schema_migrations
    where version = '20261006233000'
  ) then
    raise exception '20261006233000 ya está aplicada';
  end if;
end $$;

\ir ../supabase/migrations/20261006233000_informe_seguro_validacion.sql

insert into supabase_migrations.schema_migrations (version, name, statements)
values (
  '20261006233000',
  'informe_seguro_validacion',
  array['-- supabase/migrations/20261006233000_informe_seguro_validacion.sql']
);

COMMIT;

notify pgrst, 'reload schema';
