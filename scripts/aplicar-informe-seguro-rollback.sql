-- Rollback del informe para seguro.
-- Borra las tablas del informe y el registro de schema_migrations.
-- No toca trabajos, trabajo_media, eventos ni cotizaciones.
-- UNA sesión: BEGIN → COMMIT. No ejecutar salvo OK explícito.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

drop trigger if exists informe_seguro_media_valida on public.informe_seguro_media;
drop trigger if exists informe_seguro_subproyectos_mismo_evento on public.informe_seguro_subproyectos;
drop trigger if exists informe_seguro_recintos_mismo_evento on public.informe_seguro_recintos;
drop trigger if exists informes_seguro_set_updated_at on public.informes_seguro;

drop table if exists public.informe_seguro_versiones;
drop table if exists public.informe_seguro_media;
drop table if exists public.informe_seguro_subproyectos;
drop table if exists public.informe_seguro_recintos;
drop table if exists public.informes_seguro;

drop function if exists public.informe_seguro_media_valida();
drop function if exists public.informe_seguro_mismo_evento();

delete from supabase_migrations.schema_migrations
where version = '20261006120000';

COMMIT;
