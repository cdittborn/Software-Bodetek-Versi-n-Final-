-- Medidas de fachada opcionales: no todas las fachadas son rectángulos.
-- Superficie se escribe a mano (no se calcula alto × ancho).
-- Null = sin dato. Los CHECK > 0 se cumplen si el valor es null (PostgreSQL).
-- No modifica filas existentes.

alter table public.fachadas
  alter column alto_m drop not null;

alter table public.fachadas
  alter column ancho_m drop not null;

alter table public.fachadas
  alter column superficie_m2 drop not null;

alter table public.fachada_intervenciones
  alter column alto_m_snapshot drop not null;

alter table public.fachada_intervenciones
  alter column ancho_m_snapshot drop not null;

alter table public.fachada_intervenciones
  alter column superficie_m2_snapshot drop not null;

comment on column public.fachadas.alto_m is
  'Alto en metros, de referencia. Opcional. Si se informa, > 0.';

comment on column public.fachadas.ancho_m is
  'Ancho en metros, de referencia. Opcional. Si se informa, > 0.';

comment on column public.fachadas.superficie_m2 is
  'Superficie real a intervenir (m²), escrita a mano. Opcional. '
  'No se calcula como alto × ancho. Si se informa, > 0. '
  'Null = se excluye solo de indicadores de m² (costo/m², días/m², totales).';

comment on column public.fachada_intervenciones.alto_m_snapshot is
  'Alto copiado desde la fachada SOLO al crear la intervención. Opcional.';

comment on column public.fachada_intervenciones.ancho_m_snapshot is
  'Ancho copiado desde la fachada SOLO al crear la intervención. Opcional.';

comment on column public.fachada_intervenciones.superficie_m2_snapshot is
  'm² copiados desde la fachada SOLO al crear la intervención. Puede ser null. '
  'Editar la intervención no lo toca. Solo se refresca con la acción explícita '
  '«Actualizar medidas desde la fachada». Los indicadores no leen la medida viva.';
