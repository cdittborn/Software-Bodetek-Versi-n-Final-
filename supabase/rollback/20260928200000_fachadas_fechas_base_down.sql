-- Rollback de supabase/migrations/20260928200000_fachadas_fechas_base.sql
-- NO ejecutar salvo decisión explícita. No toca frecuencias ni el rediseño.

begin;

alter table public.fachadas
  drop constraint if exists fachadas_ultima_limpieza_fecha_check;
alter table public.fachadas
  drop constraint if exists fachadas_ultima_reparacion_fecha_check;
alter table public.fachadas
  drop constraint if exists fachadas_ultima_pintura_fecha_check;

alter table public.fachadas drop column if exists ultima_limpieza_fecha;
alter table public.fachadas drop column if exists ultima_reparacion_fecha;
alter table public.fachadas drop column if exists ultima_pintura_fecha;

delete from supabase_migrations.schema_migrations
where version = '20260928200000';

commit;
