-- Frecuencias por tipo de trabajo (limpieza / reparación / pintura).
-- Aditivo sobre 20260928120000_fachadas_redisenio.
-- frecuencia_revision_meses queda sin uso (no se borra).
-- recinto_id y letra siguen nullable y sin uso en la UI.
-- Aplicada en prod 2026-09-28 (scripts/aplicar-fachadas-frecuencias-commit.sql).

alter table public.fachadas
  add column frecuencia_limpieza_meses integer not null default 6;

alter table public.fachadas
  add column frecuencia_reparacion_meses integer not null default 24;

alter table public.fachadas
  add column frecuencia_pintura_meses integer not null default 24;

alter table public.fachadas
  add constraint fachadas_frecuencia_limpieza_meses_check
  check (frecuencia_limpieza_meses > 0);

alter table public.fachadas
  add constraint fachadas_frecuencia_reparacion_meses_check
  check (frecuencia_reparacion_meses > 0);

alter table public.fachadas
  add constraint fachadas_frecuencia_pintura_meses_check
  check (frecuencia_pintura_meses > 0);

comment on column public.fachadas.frecuencia_limpieza_meses is
  'Cada cuántos meses corresponde una limpieza. Default 6. Entero > 0.';

comment on column public.fachadas.frecuencia_reparacion_meses is
  'Cada cuántos meses corresponde una reparación. Default 24. Entero > 0.';

comment on column public.fachadas.frecuencia_pintura_meses is
  'Cada cuántos meses corresponde una pintura. Default 24. Entero > 0.';

comment on column public.fachadas.frecuencia_revision_meses is
  'SIN USO. Reemplazada por frecuencia_limpieza/reparacion/pintura_meses. No borrar.';

comment on column public.fachadas.letra is
  'SIN USO en la UI. Nullable. El nombre libre de la fachada va en nombre.';

comment on column public.fachadas.recinto_id is
  'SIN USO en la UI. Nullable. Se deja en la base; el formulario ya no lo pide.';
