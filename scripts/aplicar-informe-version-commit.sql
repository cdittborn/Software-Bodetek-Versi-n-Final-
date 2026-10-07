-- Aplica la versión por recinto del informe. UNA sesión: BEGIN → COMMIT.
-- Agrega informe_seguro_recintos.version (entero, default 1) y reemplaza la función.
-- No borra textos, archivos ni validaciones. No tocar hasta un OK explícito.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

do $$
begin
  if exists (
    select 1 from supabase_migrations.schema_migrations
    where version = '20261007180000'
  ) then
    raise exception '20261007180000 ya está aplicada';
  end if;
end $$;

\ir ../supabase/migrations/20261007180000_informe_seguro_version_recinto.sql

insert into supabase_migrations.schema_migrations (version, name, statements)
values (
  '20261007180000',
  'informe_seguro_version_recinto',
  array['-- supabase/migrations/20261007180000_informe_seguro_version_recinto.sql']
);

COMMIT;

notify pgrst, 'reload schema';
