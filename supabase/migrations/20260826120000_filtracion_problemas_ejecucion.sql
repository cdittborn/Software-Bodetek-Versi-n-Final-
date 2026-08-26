-- Campos de ejecución por tipo de problema (jsonb ya existente) + adjunto de
-- cotización asociado a un tipo + estados nuevos de filtración.

-- ========== 1) trabajo_media.problema_tipo ==========
alter table public.trabajo_media
  add column if not exists problema_tipo text;

alter table public.trabajo_media
  drop constraint if exists trabajo_media_problema_tipo_check;

alter table public.trabajo_media
  add constraint trabajo_media_problema_tipo_check
  check (
    problema_tipo is null
    or problema_tipo in (
      'techumbre',
      'canaleta',
      'cielo',
      'electrico',
      'suciedad_piso'
    )
  );

comment on column public.trabajo_media.problema_tipo is
  'Tipo de problema de filtración al que pertenece el adjunto (cotización por tipo). Null = legado a nivel de ficha.';

create index if not exists trabajo_media_problema_tipo_idx
  on public.trabajo_media (problema_tipo)
  where problema_tipo is not null;

-- ========== 2) Estados de filtración: En proceso / Ejecutado / Entregado ==========
-- No se migran filas de otros módulos. `en_proceso` ya existía (legado).
-- `terminado` se mantiene para Patentes / otros. Solo se AMPLÍA el check.

alter table public.trabajos
  drop constraint if exists trabajos_estado_check;

alter table public.trabajos
  add constraint trabajos_estado_check
  check (
    estado in (
      'planificado',
      'en_curso',
      'completado',
      'mantencion_periodica',
      'pendiente',
      'en_proceso',
      'terminado',
      'sin_asignar',
      'asignado_proveedor_sin_empezar',
      'asignado_maestros_sin_empezar',
      'asignado_proveedor_en_proceso',
      'asignado_maestros_en_proceso',
      'ejecutado_pendiente_entrega',
      'entregado'
    )
  );

comment on column public.trabajos.estado is
  'General: planificado|en_curso|completado|mantencion_periodica. '
  'Legado: pendiente|en_proceso|terminado. '
  'Lluvias: sin_asignar|asignado_proveedor_sin_empezar|asignado_maestros_sin_empezar|'
  'en_proceso|ejecutado_pendiente_entrega|entregado '
  '(también se aceptan asignado_*_en_proceso y terminado en filas no re-guardadas).';
