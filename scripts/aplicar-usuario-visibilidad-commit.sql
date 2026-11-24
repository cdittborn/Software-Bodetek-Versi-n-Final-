-- Aplica la visibilidad por persona (20261104120000).
-- UNA sesión: BEGIN → COMMIT. No usar salvo OK explícito.
-- No borra filas de trabajos, fotos, eventos, compras ni informes.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

do $$
begin
  if exists (
    select 1 from supabase_migrations.schema_migrations
    where version = '20261104120000'
  ) then
    raise exception '20261104120000 ya está aplicada';
  end if;
  if not exists (
    select 1 from supabase_migrations.schema_migrations
    where version = '20261103230000'
  ) then
    raise exception 'Falta la migración del menú (20261103230000)';
  end if;
end $$;

\ir ../supabase/migrations/20261104120000_usuario_visibilidad.sql

insert into supabase_migrations.schema_migrations (version, name, statements)
values (
  '20261104120000',
  'usuario_visibilidad',
  array['-- supabase/migrations/20261104120000_usuario_visibilidad.sql']
);

COMMIT;

notify pgrst, 'reload schema';
