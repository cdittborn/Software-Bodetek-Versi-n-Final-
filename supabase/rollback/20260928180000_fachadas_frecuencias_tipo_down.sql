-- Rollback de supabase/migrations/20260928180000_fachadas_frecuencias_tipo.sql
-- NO ejecutar salvo decisión explícita. No toca 20260924120000 ni 20260928120000.
-- frecuencia_revision_meses, letra y recinto_id se conservan.

begin;

alter table public.fachadas
  drop constraint if exists fachadas_frecuencia_limpieza_meses_check;
alter table public.fachadas
  drop constraint if exists fachadas_frecuencia_reparacion_meses_check;
alter table public.fachadas
  drop constraint if exists fachadas_frecuencia_pintura_meses_check;

alter table public.fachadas drop column if exists frecuencia_limpieza_meses;
alter table public.fachadas drop column if exists frecuencia_reparacion_meses;
alter table public.fachadas drop column if exists frecuencia_pintura_meses;

comment on column public.fachadas.frecuencia_revision_meses is
  'Cada cuántos meses se revisa la fachada (6, 12 o 24). Default 12.';
comment on column public.fachadas.letra is
  'Etiqueta corta A, B, C… para el mapa (B14·A = código recinto + letra). '
  'Null si aún no se asignó. El formulario la pide junto con el nombre.';
comment on column public.fachadas.recinto_id is
  'Recinto asociado. Sigue nullable en BD (fachadas generales legacy). '
  'El formulario lo exige.';

delete from supabase_migrations.schema_migrations
where version = '20260928180000';

commit;
