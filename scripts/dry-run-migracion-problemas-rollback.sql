-- DRY-RUN en una sola transacción. Este archivo NO contiene COMMIT.
-- Pensado para psql en una sola sesión:
--   bash scripts/dry-run-migracion-problemas-rollback.sh
--
-- Si la conexión se cae a mitad de camino, Postgres revierte solo.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

SELECT
  'sesion'::text AS seccion,
  pg_backend_pid() AS pid,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'trabajos'
      AND column_name = 'problemas'
  ) AS columna_problemas_ya_existia;

-- === mismo DDL que 20260825190000_filtracion_problemas.sql ===

alter table public.trabajos
  add column if not exists problemas jsonb;

comment on column public.trabajos.problemas is
  'Bloques por tipo de problema (techumbre|canaleta|cielo|electrico): {activo, descripcion, plan}. '
  'El backfill legado usa techumbre como DEFAULT (no es clasificación real).';

SELECT
  'antes_del_update'::text AS seccion,
  count(*)::int AS total_filtraciones,
  count(*) FILTER (
    WHERE coalesce(btrim(descripcion), '') <> ''
       OR coalesce(btrim(plan_accion), '') <> ''
  )::int AS con_texto_legado,
  count(*) FILTER (WHERE problemas IS NOT NULL)::int AS con_json_ya_existente
FROM public.trabajos
WHERE evento_id IS NOT NULL;

-- mismo UPDATE que la migración, con RETURNING para contar filas migradas
WITH updated AS (
  UPDATE public.trabajos
  SET problemas = jsonb_build_object(
    'techumbre', jsonb_build_object(
      'activo', true,
      'descripcion', coalesce(descripcion, ''),
      'plan', coalesce(plan_accion, '')
    ),
    'canaleta', jsonb_build_object(
      'activo', false,
      'descripcion', '',
      'plan', ''
    ),
    'cielo', jsonb_build_object(
      'activo', false,
      'descripcion', '',
      'plan', ''
    ),
    'electrico', jsonb_build_object(
      'activo', false,
      'descripcion', '',
      'plan', ''
    )
  )
  WHERE evento_id IS NOT NULL
    AND problemas IS NULL
    AND (
      coalesce(btrim(descripcion), '') <> ''
      OR coalesce(btrim(plan_accion), '') <> ''
    )
  RETURNING id
)
SELECT 'filas_migradas'::text AS seccion, count(*)::int AS n FROM updated;

-- === fin de la migración ===

-- Verificación (misma transacción)
with filtraciones as (
  select
    id,
    codigo_filtracion,
    descripcion,
    plan_accion,
    problemas,
    coalesce(problemas -> 'techumbre' ->> 'descripcion', '') as d_techumbre,
    coalesce(problemas -> 'canaleta' ->> 'descripcion', '') as d_canaleta,
    coalesce(problemas -> 'cielo' ->> 'descripcion', '') as d_cielo,
    coalesce(problemas -> 'electrico' ->> 'descripcion', '') as d_electrico,
    coalesce(problemas -> 'techumbre' ->> 'plan', '') as p_techumbre,
    coalesce(problemas -> 'canaleta' ->> 'plan', '') as p_canaleta,
    coalesce(problemas -> 'cielo' ->> 'plan', '') as p_cielo,
    coalesce(problemas -> 'electrico' ->> 'plan', '') as p_electrico
  from public.trabajos
  where evento_id is not null
),
marcadas as (
  select
    f.*,
    (
      coalesce(btrim(descripcion), '') <> ''
      or coalesce(btrim(plan_accion), '') <> ''
    ) as tiene_texto_legado,
    (
      coalesce(descripcion, '') <> ''
      and coalesce(descripcion, '') not in (d_techumbre, d_canaleta, d_cielo, d_electrico)
    ) as descripcion_perdida,
    (
      coalesce(plan_accion, '') <> ''
      and coalesce(plan_accion, '') not in (p_techumbre, p_canaleta, p_cielo, p_electrico)
    ) as plan_perdido
  from filtraciones f
),
conteos as (
  select
    count(*)::int as total_filtraciones,
    count(*) filter (where tiene_texto_legado)::int as con_texto_legado,
    count(*) filter (where problemas is not null)::int as con_json_problemas,
    count(*) filter (
      where problemas -> 'techumbre' ->> 'activo' = 'true'
    )::int as techumbre_activo_default,
    count(*) filter (
      where problemas -> 'canaleta' ->> 'activo' = 'true'
         or problemas -> 'cielo' ->> 'activo' = 'true'
         or problemas -> 'electrico' ->> 'activo' = 'true'
    )::int as otros_tipos_activos,
    count(*) filter (
      where problemas is not null
        and (descripcion_perdida or plan_perdido)
    )::int as filas_texto_no_coincide,
    count(*) filter (
      where problemas is null and tiene_texto_legado
    )::int as con_texto_sin_json
  from marcadas
)
select
  'verificacion'::text as seccion,
  case
    when filas_texto_no_coincide = 0 and con_texto_sin_json = 0 then 'PASS'
    else 'FAIL'
  end as veredicto,
  total_filtraciones,
  con_texto_legado,
  con_json_problemas,
  techumbre_activo_default,
  otros_tipos_activos,
  filas_texto_no_coincide,
  con_texto_sin_json
from conteos;

select
  'muestra'::text as seccion,
  id,
  codigo_filtracion,
  left(coalesce(descripcion, ''), 120) as descripcion_antes,
  left(coalesce(problemas -> 'techumbre' ->> 'descripcion', ''), 120) as techumbre_despues,
  left(coalesce(plan_accion, ''), 120) as plan_antes,
  left(coalesce(problemas -> 'techumbre' ->> 'plan', ''), 120) as plan_despues,
  (
    (
      coalesce(descripcion, '') = ''
      or coalesce(descripcion, '') in (
        coalesce(problemas -> 'techumbre' ->> 'descripcion', ''),
        coalesce(problemas -> 'canaleta' ->> 'descripcion', ''),
        coalesce(problemas -> 'cielo' ->> 'descripcion', ''),
        coalesce(problemas -> 'electrico' ->> 'descripcion', '')
      )
    )
    and (
      coalesce(plan_accion, '') = ''
      or coalesce(plan_accion, '') in (
        coalesce(problemas -> 'techumbre' ->> 'plan', ''),
        coalesce(problemas -> 'canaleta' ->> 'plan', ''),
        coalesce(problemas -> 'cielo' ->> 'plan', ''),
        coalesce(problemas -> 'electrico' ->> 'plan', '')
      )
    )
  ) as texto_ok
from public.trabajos
where evento_id is not null
  and problemas is not null
order by codigo_filtracion nulls last, id;

ROLLBACK; -- para que nada quede guardado todavía
