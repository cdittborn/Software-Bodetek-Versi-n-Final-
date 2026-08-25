-- DRY-RUN en una sola transacción. Este archivo NO contiene COMMIT.
--   bash scripts/dry-run-migracion-problemas-rollback.sh
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

alter table public.trabajos
  add column if not exists problemas jsonb;

comment on column public.trabajos.problemas is
  'Bloques por tipo (techumbre|canaleta|cielo|electrico): {activo, descripcion, plan}. '
  'Backfill legado: keywords canaleta/cielo/eléctric|electric; 0 hits → techumbre fallback; '
  '2+ hits → todos los matcheados (ambiguo, reclasificar a mano).';

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

-- mismo UPDATE que 20260825190000_filtracion_problemas.sql
WITH clasificadas AS (
  SELECT
    t.id,
    coalesce(t.descripcion, '') AS d,
    coalesce(t.plan_accion, '') AS p,
    (coalesce(t.descripcion, '') || E'\n' || coalesce(t.plan_accion, '')) ~* 'canaleta' AS hay_canaleta,
    (coalesce(t.descripcion, '') || E'\n' || coalesce(t.plan_accion, '')) ~* 'cielo' AS hay_cielo,
    (
      (coalesce(t.descripcion, '') || E'\n' || coalesce(t.plan_accion, '')) ~* 'electric'
      OR (coalesce(t.descripcion, '') || E'\n' || coalesce(t.plan_accion, '')) ~* 'eléctric'
    ) AS hay_electrico
  FROM public.trabajos t
  WHERE t.evento_id IS NOT NULL
    AND t.problemas IS NULL
    AND (
      coalesce(btrim(t.descripcion), '') <> ''
      OR coalesce(btrim(t.plan_accion), '') <> ''
    )
),
updated AS (
  UPDATE public.trabajos t
  SET problemas = jsonb_build_object(
    'techumbre', jsonb_build_object(
      'activo', NOT (c.hay_canaleta OR c.hay_cielo OR c.hay_electrico),
      'descripcion', CASE WHEN NOT (c.hay_canaleta OR c.hay_cielo OR c.hay_electrico) THEN c.d ELSE '' END,
      'plan', CASE WHEN NOT (c.hay_canaleta OR c.hay_cielo OR c.hay_electrico) THEN c.p ELSE '' END
    ),
    'canaleta', jsonb_build_object(
      'activo', c.hay_canaleta,
      'descripcion', CASE WHEN c.hay_canaleta THEN c.d ELSE '' END,
      'plan', CASE WHEN c.hay_canaleta THEN c.p ELSE '' END
    ),
    'cielo', jsonb_build_object(
      'activo', c.hay_cielo,
      'descripcion', CASE WHEN c.hay_cielo THEN c.d ELSE '' END,
      'plan', CASE WHEN c.hay_cielo THEN c.p ELSE '' END
    ),
    'electrico', jsonb_build_object(
      'activo', c.hay_electrico,
      'descripcion', CASE WHEN c.hay_electrico THEN c.d ELSE '' END,
      'plan', CASE WHEN c.hay_electrico THEN c.p ELSE '' END
    )
  )
  FROM clasificadas c
  WHERE t.id = c.id
  RETURNING t.id
)
SELECT 'filas_migradas'::text AS seccion, count(*)::int AS n FROM updated;

-- Desglose de heurística (sobre texto legado, no sobre un único tipo asignado)
WITH hits AS (
  SELECT
    codigo_filtracion,
    descripcion,
    (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'canaleta' AS hay_canaleta,
    (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'cielo' AS hay_cielo,
    (
      (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'electric'
      OR (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'eléctric'
    ) AS hay_electrico
  FROM public.trabajos
  WHERE evento_id IS NOT NULL
),
n AS (
  SELECT
    *,
    (hay_canaleta::int + hay_cielo::int + hay_electrico::int) AS n_hits
  FROM hits
)
SELECT
  'desglose'::text AS seccion,
  count(*) FILTER (WHERE n_hits = 0)::int AS fallback_techumbre,
  count(*) FILTER (WHERE n_hits = 1 AND hay_canaleta)::int AS unico_canaleta,
  count(*) FILTER (WHERE n_hits = 1 AND hay_cielo)::int AS unico_cielo,
  count(*) FILTER (WHERE n_hits = 1 AND hay_electrico)::int AS unico_electrico,
  count(*) FILTER (WHERE n_hits >= 2)::int AS ambiguos,
  count(*)::int AS total
FROM n;

SELECT
  'ambiguos'::text AS seccion,
  codigo_filtracion,
  concat_ws(
    ', ',
    CASE WHEN hay_canaleta THEN 'canaleta' END,
    CASE WHEN hay_cielo THEN 'cielo' END,
    CASE WHEN hay_electrico THEN 'electrico' END
  ) AS keywords,
  left(coalesce(descripcion, ''), 140) AS descripcion
FROM (
  SELECT
    codigo_filtracion,
    descripcion,
    (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'canaleta' AS hay_canaleta,
    (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'cielo' AS hay_cielo,
    (
      (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'electric'
      OR (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'eléctric'
    ) AS hay_electrico
  FROM public.trabajos
  WHERE evento_id IS NOT NULL
) s
WHERE (hay_canaleta::int + hay_cielo::int + hay_electrico::int) >= 2
ORDER BY codigo_filtracion;

-- Verificación de texto conservado
WITH filtraciones AS (
  SELECT
    id,
    codigo_filtracion,
    descripcion,
    plan_accion,
    problemas,
    coalesce(problemas -> 'techumbre' ->> 'descripcion', '') AS d_techumbre,
    coalesce(problemas -> 'canaleta' ->> 'descripcion', '') AS d_canaleta,
    coalesce(problemas -> 'cielo' ->> 'descripcion', '') AS d_cielo,
    coalesce(problemas -> 'electrico' ->> 'descripcion', '') AS d_electrico,
    coalesce(problemas -> 'techumbre' ->> 'plan', '') AS p_techumbre,
    coalesce(problemas -> 'canaleta' ->> 'plan', '') AS p_canaleta,
    coalesce(problemas -> 'cielo' ->> 'plan', '') AS p_cielo,
    coalesce(problemas -> 'electrico' ->> 'plan', '') AS p_electrico
  FROM public.trabajos
  WHERE evento_id IS NOT NULL
),
marcadas AS (
  SELECT
    f.*,
    (
      coalesce(btrim(descripcion), '') <> ''
      OR coalesce(btrim(plan_accion), '') <> ''
    ) AS tiene_texto_legado,
    (
      coalesce(descripcion, '') <> ''
      AND coalesce(descripcion, '') NOT IN (d_techumbre, d_canaleta, d_cielo, d_electrico)
    ) AS descripcion_perdida,
    (
      coalesce(plan_accion, '') <> ''
      AND coalesce(plan_accion, '') NOT IN (p_techumbre, p_canaleta, p_cielo, p_electrico)
    ) AS plan_perdido
  FROM filtraciones f
),
conteos AS (
  SELECT
    count(*)::int AS total_filtraciones,
    count(*) FILTER (WHERE problemas IS NOT NULL)::int AS con_json_problemas,
    count(*) FILTER (
      WHERE problemas IS NOT NULL AND (descripcion_perdida OR plan_perdido)
    )::int AS filas_texto_no_coincide,
    count(*) FILTER (
      WHERE problemas IS NULL AND tiene_texto_legado
    )::int AS con_texto_sin_json
  FROM marcadas
)
SELECT
  'verificacion'::text AS seccion,
  CASE
    WHEN filas_texto_no_coincide = 0 AND con_texto_sin_json = 0 THEN 'PASS'
    ELSE 'FAIL'
  END AS veredicto,
  total_filtraciones,
  con_json_problemas,
  filas_texto_no_coincide,
  con_texto_sin_json
FROM conteos;

SELECT
  'muestra'::text AS seccion,
  codigo_filtracion,
  concat_ws(
    '+',
    CASE WHEN problemas -> 'techumbre' ->> 'activo' = 'true' THEN 'techumbre' END,
    CASE WHEN problemas -> 'canaleta' ->> 'activo' = 'true' THEN 'canaleta' END,
    CASE WHEN problemas -> 'cielo' ->> 'activo' = 'true' THEN 'cielo' END,
    CASE WHEN problemas -> 'electrico' ->> 'activo' = 'true' THEN 'electrico' END
  ) AS tipos_activos,
  (
    (
      (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'canaleta'
    )::int
    + (
      (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'cielo'
    )::int
    + (
      (
        (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'electric'
        OR (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'eléctric'
      )::int
    )
  ) >= 2 AS ambiguo,
  left(coalesce(descripcion, ''), 90) AS descripcion_antes,
  (
    coalesce(descripcion, '') = ''
    OR coalesce(descripcion, '') IN (
      coalesce(problemas -> 'techumbre' ->> 'descripcion', ''),
      coalesce(problemas -> 'canaleta' ->> 'descripcion', ''),
      coalesce(problemas -> 'cielo' ->> 'descripcion', ''),
      coalesce(problemas -> 'electrico' ->> 'descripcion', '')
    )
  )
  AND (
    coalesce(plan_accion, '') = ''
    OR coalesce(plan_accion, '') IN (
      coalesce(problemas -> 'techumbre' ->> 'plan', ''),
      coalesce(problemas -> 'canaleta' ->> 'plan', ''),
      coalesce(problemas -> 'cielo' ->> 'plan', ''),
      coalesce(problemas -> 'electrico' ->> 'plan', '')
    )
  ) AS texto_ok
FROM public.trabajos
WHERE evento_id IS NOT NULL
  AND problemas IS NOT NULL
ORDER BY
  (
    (
      (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'canaleta'
    )::int
    + (
      (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'cielo'
    )::int
    + (
      (
        (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'electric'
        OR (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'eléctric'
      )::int
    )
  ) DESC,
  codigo_filtracion NULLS LAST;

ROLLBACK; -- para que nada quede guardado todavía
