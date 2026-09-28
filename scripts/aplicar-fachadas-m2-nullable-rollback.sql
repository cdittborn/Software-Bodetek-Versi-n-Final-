-- Rollback de medidas opcionales. Restaura NOT NULL.
-- Solo funciona si no hay nulls en esas columnas.
-- UNA sesión: BEGIN → COMMIT. No usar salvo OK explícito.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

alter table public.fachadas
  alter column alto_m set not null;

alter table public.fachadas
  alter column ancho_m set not null;

alter table public.fachadas
  alter column superficie_m2 set not null;

alter table public.fachada_intervenciones
  alter column alto_m_snapshot set not null;

alter table public.fachada_intervenciones
  alter column ancho_m_snapshot set not null;

alter table public.fachada_intervenciones
  alter column superficie_m2_snapshot set not null;

comment on column public.fachadas.alto_m is
  'Alto en metros. Obligatorio, > 0.';

comment on column public.fachadas.ancho_m is
  'Ancho en metros. Obligatorio, > 0.';

comment on column public.fachadas.superficie_m2 is
  'm² totales. Autocompletado alto×ancho en el formulario; el usuario puede '
  'editarlo (vanos, portones, formas irregulares).';

comment on column public.fachada_intervenciones.alto_m_snapshot is
  'Alto copiado desde la fachada SOLO al crear la intervención.';

comment on column public.fachada_intervenciones.ancho_m_snapshot is
  'Ancho copiado desde la fachada SOLO al crear la intervención.';

comment on column public.fachada_intervenciones.superficie_m2_snapshot is
  'm² copiados desde la fachada SOLO al crear la intervención. Editar la '
  'intervención no lo toca. Solo se refresca con la acción explícita '
  '«Actualizar medidas desde la fachada». Los indicadores no leen la medida viva.';

delete from supabase_migrations.schema_migrations
where version = '20260928210000';

COMMIT;
