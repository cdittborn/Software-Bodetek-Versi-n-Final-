-- Rollback de supabase/migrations/20260924120000_fachadas.sql
-- Borra SOLO lo creado por esa migración, en orden de dependencias.
-- NO ejecutar salvo decisión explícita de revertir Fachadas.

begin;

drop table if exists public.fachada_media cascade;
drop table if exists public.fachada_materiales cascade;
drop table if exists public.fachada_hojalateria cascade;
drop table if exists public.fachada_cotizacion_tipos cascade;
drop table if exists public.fachada_cotizaciones cascade;
drop table if exists public.fachada_intervencion_tipos cascade;
drop table if exists public.fachada_intervenciones cascade;
drop table if exists public.fachadas cascade;
drop table if exists public.proveedor_rubros cascade;

drop function if exists public.set_updated_at();

delete from supabase_migrations.schema_migrations
where version = '20260924120000';

commit;
