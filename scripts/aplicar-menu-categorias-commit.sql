-- Aplica el menú editable y archiva "Otros trabajos CD" (20261103230000).
-- UNA sesión: BEGIN → COMMIT. No usar salvo OK explícito.
-- No borra filas. Aborta si la migración ya está aplicada.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

do $$
begin
  if exists (
    select 1
    from supabase_migrations.schema_migrations
    where version = '20261103230000'
  ) then
    raise exception '20261103230000 ya está aplicada';
  end if;
end $$;

\ir ../supabase/migrations/20261103230000_menu_categorias.sql

insert into supabase_migrations.schema_migrations (version, name, statements)
values (
  '20261103230000',
  'menu_categorias',
  array['-- supabase/migrations/20261103230000_menu_categorias.sql']
);

COMMIT;

notify pgrst, 'reload schema';
