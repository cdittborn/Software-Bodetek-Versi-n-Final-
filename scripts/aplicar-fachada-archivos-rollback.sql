-- Rollback de la galería fachada_archivos.
-- Borra la tabla (y las filas copiadas) y saca el registro de schema_migrations.
-- Restaura el comentario de fachadas.foto_key. No toca la columna.
-- UNA sesión: BEGIN → COMMIT. No ejecutar salvo OK explícito.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

drop table if exists public.fachada_archivos cascade;

comment on column public.fachadas.foto_key is
  'Key R2 de la foto general: fachadas/{id}/general/…';

delete from supabase_migrations.schema_migrations
where version = '20261005120000';

COMMIT;
