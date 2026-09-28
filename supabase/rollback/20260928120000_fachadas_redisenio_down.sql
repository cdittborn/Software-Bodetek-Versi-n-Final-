-- Rollback de supabase/migrations/20260928120000_fachadas_redisenio.sql
-- NO ejecutar salvo decisión explícita. Revierte columnas/tablas de esta
-- migración; no toca 20260924120000.

begin;

drop index if exists public.fachada_media_portada_unica;
alter table public.fachada_media drop column if exists fecha;
alter table public.fachada_media drop column if exists orden;
alter table public.fachada_media drop column if exists es_portada;

drop table if exists public.fachada_documentos cascade;

alter table public.fachada_materiales drop constraint if exists fachada_materiales_tipo_check;
alter table public.fachada_materiales drop column if exists tipo;

alter table public.fachada_intervenciones
  drop constraint if exists fachada_intervenciones_estado_check;

alter table public.fachada_intervenciones
  alter column estado drop not null;

alter table public.fachada_intervenciones
  alter column estado drop default;

update public.fachada_intervenciones
set estado = case
  when estado = 'programada' then 'sin_empezar'
  when estado = 'en_ejecucion' then 'en_proceso'
  when estado = 'terminada' then 'entregado'
  else estado
end;

alter table public.fachada_intervenciones
  add constraint fachada_intervenciones_estado_check
  check (
    estado is null
    or estado in (
      'sin_empezar',
      'en_proceso',
      'ejecutado_pendiente_entrega',
      'entregado'
    )
  );

alter table public.fachada_intervenciones drop column if exists maestros_asignados;

alter table public.fachadas drop constraint if exists fachadas_frecuencia_revision_meses_check;
alter table public.fachadas drop column if exists frecuencia_revision_meses;
alter table public.fachadas drop column if exists letra;

delete from supabase_migrations.schema_migrations
where version = '20260928120000';

commit;
