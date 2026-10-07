-- Vuelve a la función que reemplaza el informe entero y quita version.
-- No borra filas, textos ni archivos. UNA sesión: BEGIN → COMMIT.
-- Usarlo solo junto con la pantalla anterior: si la pantalla nueva
-- manda un recinto y la función vieja está activa, esa función borra el resto.
-- No ejecutar salvo OK explícito.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

\ir ../supabase/migrations/20261007013000_informe_seguro_guardado.sql

alter table public.informe_seguro_recintos
  drop column if exists version;

delete from supabase_migrations.schema_migrations
where version = '20261007180000';

COMMIT;

notify pgrst, 'reload schema';
