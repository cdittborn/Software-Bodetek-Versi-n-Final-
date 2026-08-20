-- Lluvias y temporales: nuevos estados/gravedad/ejecutado_por + proveedor + valor_reparacion
-- + trabajo_media.tipo plano_filtraciones.
--
-- DEPENDENCIA: aplicar antes 20260819222100_temporal_16ago2026_proyectos.sql
-- (carga de los 26 con valores viejos). En remoto esa migración aún estaba pendiente
-- al momento de escribir esta.
--
-- Orden: ampliar checks → migrar datos. No toca Patentes/Techos/Auth
-- (solo amplía checks compartidos de trabajos / trabajo_media).

-- ========== columnas nuevas ==========
alter table public.trabajos
  add column if not exists proveedor text;

alter table public.trabajos
  add column if not exists valor_reparacion numeric(14, 2);

alter table public.trabajos
  add column if not exists ejecutado_por text;

comment on column public.trabajos.proveedor is
  'Nombre del proveedor externo específico. Nullable.';
comment on column public.trabajos.valor_reparacion is
  'Monto de la reparación. Nullable.';

-- ========== 1) Ampliar checks ANTES de migrar datos ==========
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
      'asignado_maestros_en_proceso'
    )
  );

comment on column public.trabajos.estado is
  'General: planificado|en_curso|completado|mantencion_periodica. '
  'Legado: pendiente|en_proceso|terminado. '
  'Lluvias: sin_asignar|asignado_proveedor_sin_empezar|asignado_maestros_sin_empezar|'
  'asignado_proveedor_en_proceso|asignado_maestros_en_proceso|terminado.';

-- Permitir valores viejos y nuevos de gravedad durante la migración.
alter table public.trabajos
  drop constraint if exists trabajos_gravedad_check;

alter table public.trabajos
  add constraint trabajos_gravedad_check
  check (
    gravedad is null
    or gravedad in ('alta', 'media', 'baja', 'critico', 'medio', 'bajo')
  );

-- ========== 2) Migrar ejecutado_por (texto → enum) ==========
update public.trabajos as t
set ejecutado_por = v.nuevo
from public.recintos as r
cross join public.eventos as e
join (
  values
    ('1', '1B', 'proveedor_externo'::text),
    ('1', 'LOCAL 6', 'proveedor_externo'),
    ('1', 'LOCAL 2 Y 3', 'proveedor_externo'),
    ('1', '2A', null),
    ('2', '7', 'proveedor_externo'),
    ('2', 'LOCAL 3', null),
    ('2', 'LOCAL 4', null),
    ('2', 'LOCAL 5', null),
    ('1', 'LOCAL 1', null),
    ('1', 'LOCAL 4', null),
    ('1', 'LOCAL 5', 'proveedor_externo'),
    ('1', 'LOCAL 7', null),
    ('1', '5', 'proveedor_externo'),
    ('2', '6', 'proveedor_externo'),
    ('2', 'LOCAL 1 Y 2', null),
    ('1', '4B', null),
    ('1', '4A', null),
    ('2', 'S3', null),
    ('2', 'S2', null),
    ('2', 'S1', null),
    ('1', '2B', null),
    ('1', '3B1', null),
    ('1', '3A', 'proveedor_externo'),
    ('', 'ADMINISTRACION', null),
    ('', 'BAÑO ADMINISTRACION', null),
    ('', 'GARITA P1', null)
) as v (sitio, codigo, nuevo)
  on r.sitio = v.sitio and r.codigo = v.codigo
where t.recinto_id = r.id
  and t.evento_id = e.id
  and e.nombre = 'Temporal 16 ago 2026';

alter table public.trabajos
  drop constraint if exists trabajos_ejecutado_por_check;

alter table public.trabajos
  add constraint trabajos_ejecutado_por_check
  check (
    ejecutado_por is null
    or ejecutado_por in ('maestros_bodetek', 'proveedor_externo', 'ambos')
  );

comment on column public.trabajos.ejecutado_por is
  'maestros_bodetek | proveedor_externo | ambos. Null = aún sin asignar.';

-- ========== 3) Migrar gravedad ==========
update public.trabajos
set gravedad = case gravedad
  when 'alta' then 'critico'
  when 'media' then 'medio'
  when 'baja' then 'bajo'
  else gravedad
end
where gravedad in ('alta', 'media', 'baja');

alter table public.trabajos
  drop constraint if exists trabajos_gravedad_check;

alter table public.trabajos
  add constraint trabajos_gravedad_check
  check (gravedad is null or gravedad in ('critico', 'medio', 'bajo'));

comment on column public.trabajos.gravedad is
  'critico | medio | bajo. Null fuera de Lluvias y temporales.';

-- ========== 4) Migrar estados (solo evento Temporal 16 ago 2026) ==========
update public.trabajos as t
set estado = v.nuevo
from public.recintos as r
cross join public.eventos as e
join (
  values
    ('1', '1B', 'asignado_proveedor_en_proceso'),
    ('1', 'LOCAL 6', 'asignado_proveedor_en_proceso'),
    ('1', 'LOCAL 2 Y 3', 'asignado_proveedor_en_proceso'),
    ('1', '2A', 'sin_asignar'),
    ('2', '7', 'asignado_proveedor_sin_empezar'),
    ('2', 'LOCAL 3', 'sin_asignar'),
    ('2', 'LOCAL 4', 'sin_asignar'),
    ('2', 'LOCAL 5', 'sin_asignar'),
    ('1', 'LOCAL 1', 'sin_asignar'),
    ('1', 'LOCAL 4', 'sin_asignar'),
    ('1', 'LOCAL 5', 'asignado_proveedor_sin_empezar'),
    ('1', 'LOCAL 7', 'sin_asignar'),
    ('1', '5', 'asignado_proveedor_sin_empezar'),
    ('2', '6', 'asignado_proveedor_en_proceso'),
    ('2', 'LOCAL 1 Y 2', 'sin_asignar'),
    ('1', '4B', 'sin_asignar'),
    ('1', '4A', 'sin_asignar'),
    ('2', 'S3', 'sin_asignar'),
    ('2', 'S2', 'sin_asignar'),
    ('2', 'S1', 'sin_asignar'),
    ('1', '2B', 'sin_asignar'),
    ('1', '3B1', 'sin_asignar'),
    ('1', '3A', 'asignado_proveedor_en_proceso'),
    ('', 'ADMINISTRACION', 'sin_asignar'),
    ('', 'BAÑO ADMINISTRACION', 'sin_asignar'),
    ('', 'GARITA P1', 'sin_asignar')
) as v (sitio, codigo, nuevo)
  on r.sitio = v.sitio and r.codigo = v.codigo
where t.recinto_id = r.id
  and t.evento_id = e.id
  and e.nombre = 'Temporal 16 ago 2026';

-- ========== 5) trabajo_media: plano_filtraciones ==========
alter table public.trabajo_media
  drop constraint if exists trabajo_media_tipo_check;

alter table public.trabajo_media
  add constraint trabajo_media_tipo_check
  check (
    (trabajo_id is null or tipo is not null)
    and (
      tipo is null
      or tipo in (
        'antes',
        'despues',
        'adjunto',
        'patente_provisoria',
        'cotizacion',
        'plano_filtraciones'
      )
    )
  );

comment on column public.trabajo_media.tipo is
  'antes|despues; adjunto|patente_provisoria; cotizacion|plano_filtraciones; null = inbox.';
