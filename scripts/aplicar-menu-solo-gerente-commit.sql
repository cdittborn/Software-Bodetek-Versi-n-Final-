-- Aplica el menú solo del Gerente General (20261107180000).
-- UNA sesión: BEGIN → COMMIT. No usar salvo OK explícito.
-- No borra filas. Las políticas viejas se quedan.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

do $$
begin
  if exists (
    select 1 from supabase_migrations.schema_migrations
    where version = '20261107180000'
  ) then
    raise exception '20261107180000 ya está aplicada';
  end if;
  if not exists (
    select 1 from supabase_migrations.schema_migrations
    where version = '20261103230000'
  ) then
    raise exception 'Falta la migración del menú (20261103230000)';
  end if;
end $$;

\ir ../supabase/migrations/20261107180000_menu_solo_gerente.sql

insert into supabase_migrations.schema_migrations (version, name, statements)
values (
  '20261107180000',
  'menu_solo_gerente',
  array['-- supabase/migrations/20261107180000_menu_solo_gerente.sql']
);

COMMIT;

notify pgrst, 'reload schema';
