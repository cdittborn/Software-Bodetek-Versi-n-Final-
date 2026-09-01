-- Estado de filtración independiente de «Ejecutado por».
-- El estado deja de nombrar al ejecutor:
--   '' | sin_empezar | en_proceso | ejecutado_pendiente_entrega | entregado
-- Remapeo de problemas JSON (sin tocar descripción, plan, fechas, horas, cotización):
--   sin_asignar                         → estado ''
--   asignado_proveedor_sin_empezar      → sin_empezar (+ ejecutor proveedor si faltaba)
--   asignado_maestros_sin_empezar       → sin_empezar (+ ejecutor maestros si faltaba)
--   en_proceso / ejecutado / entregado  → sin cambio de estado ni ejecutor
--
-- No aplicar en producción sin dry-run + confirmación explícita.

-- ========== 1) Ampliar check (valores nuevos + legado hasta el remapeo) ==========
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
      '',
      'sin_empezar',
      'ejecutado_pendiente_entrega',
      'entregado',
      'sin_asignar',
      'asignado_proveedor_sin_empezar',
      'asignado_maestros_sin_empezar',
      'asignado_proveedor_en_proceso',
      'asignado_maestros_en_proceso'
    )
  );

-- ========== 2) Helpers de remapeo (se eliminan al final) ==========
create or replace function public._filtracion_remap_bloque_estado(b jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  est text;
  eje text;
begin
  if b is null or jsonb_typeof(b) <> 'object' then
    return b;
  end if;
  est := coalesce(b->>'estado', '');
  eje := coalesce(
    nullif(b->>'ejecutadoPor', ''),
    nullif(b->>'ejecutado_por', ''),
    ''
  );

  if est in ('asignado_proveedor_en_proceso', 'asignado_maestros_en_proceso') then
    est := 'en_proceso';
  elsif est = 'terminado' then
    est := 'entregado';
  end if;

  if est in ('sin_asignar', '') then
    b := jsonb_set(b, '{estado}', to_jsonb(''::text), true);
  elsif est = 'asignado_proveedor_sin_empezar' then
    b := jsonb_set(b, '{estado}', to_jsonb('sin_empezar'::text), true);
    if eje = '' then
      b := jsonb_set(b, '{ejecutadoPor}', to_jsonb('proveedor_externo'::text), true);
    end if;
  elsif est = 'asignado_maestros_sin_empezar' then
    b := jsonb_set(b, '{estado}', to_jsonb('sin_empezar'::text), true);
    if eje = '' then
      b := jsonb_set(b, '{ejecutadoPor}', to_jsonb('maestros_bodetek'::text), true);
    end if;
  else
    b := jsonb_set(b, '{estado}', to_jsonb(est), true);
  end if;
  return b;
end;
$$;

create or replace function public._filtracion_remap_problemas(p jsonb)
returns jsonb
language sql
immutable
as $$
  select case
    when p is null or jsonb_typeof(p) <> 'object' then p
    else (
      select coalesce(
        jsonb_object_agg(e.key, public._filtracion_remap_bloque_estado(e.value)),
        '{}'::jsonb
      )
      from jsonb_each(p) e
    )
  end
$$;

create or replace function public._filtracion_estado_agregado(p jsonb)
returns text
language plpgsql
immutable
as $$
declare
  min_ord int := 99;
  ord int;
  est text;
  rec record;
  any_activo boolean := false;
begin
  if p is null or jsonb_typeof(p) <> 'object' then
    return '';
  end if;
  for rec in select value from jsonb_each(p)
  loop
    if coalesce(rec.value->>'activo', 'false') <> 'true' then
      continue;
    end if;
    any_activo := true;
    est := coalesce(rec.value->>'estado', '');
    ord := case est
      when '' then 0
      when 'sin_empezar' then 1
      when 'en_proceso' then 2
      when 'ejecutado_pendiente_entrega' then 3
      when 'entregado' then 4
      else 0
    end;
    if ord < min_ord then
      min_ord := ord;
    end if;
  end loop;
  if not any_activo then
    return '';
  end if;
  return case min_ord
    when 0 then ''
    when 1 then 'sin_empezar'
    when 2 then 'en_proceso'
    when 3 then 'ejecutado_pendiente_entrega'
    when 4 then 'entregado'
    else ''
  end;
end;
$$;

-- ========== 3) Remapear JSON + estado agregado de ficha ==========
update public.trabajos t
set
  problemas = public._filtracion_remap_problemas(t.problemas),
  estado = public._filtracion_estado_agregado(
    public._filtracion_remap_problemas(t.problemas)
  )
where t.evento_id is not null
  and t.problemas is not null
  and jsonb_typeof(t.problemas) = 'object';

-- ========== 4) Check final: estado ya no nombra al ejecutor ==========
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
      '',
      'sin_empezar',
      'ejecutado_pendiente_entrega',
      'entregado'
    )
  );

comment on column public.trabajos.estado is
  'General: planificado|en_curso|completado|mantencion_periodica. '
  'Legado: pendiente|en_proceso|terminado. '
  'Lluvias (independiente del ejecutor): ''''|sin_empezar|en_proceso|'
  'ejecutado_pendiente_entrega|entregado.';

drop function if exists public._filtracion_estado_agregado(jsonb);
drop function if exists public._filtracion_remap_problemas(jsonb);
drop function if exists public._filtracion_remap_bloque_estado(jsonb);
