-- Validación de la descripción del informe, por recinto.
-- No borra filas ni cambia fotos, versiones ni la ficha.

alter table public.informe_seguro_recintos
  add column descripcion_validada boolean not null default false,
  add column validada_at timestamptz,
  add column validada_por uuid references public.perfiles (id);

comment on column public.informe_seguro_recintos.descripcion_validada is
  'El texto de Qué pasó de este recinto fue revisado para el seguro. Se apaga si se edita un texto.';
