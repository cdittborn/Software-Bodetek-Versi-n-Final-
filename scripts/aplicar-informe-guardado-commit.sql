-- Aplica solo la función de guardado del informe. UNA sesión: BEGIN → COMMIT.
-- La función no recibe ni escribe vencimiento. No borra la columna.
-- No ejecutar salvo OK explícito. No está aplicada.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

do $$
begin
  if exists (
    select 1 from supabase_migrations.schema_migrations
    where version = '20261007013000'
  ) then
    raise exception '20261007013000 ya está aplicada';
  end if;
end $$;

\ir ../supabase/migrations/20261007013000_informe_seguro_guardado.sql

insert into supabase_migrations.schema_migrations (version, name, statements)
values (
  '20261007013000',
  'informe_seguro_guardado',
  array['-- supabase/migrations/20261007013000_informe_seguro_guardado.sql']
);

COMMIT;

notify pgrst, 'reload schema';
