-- Verificación post-migración de trabajos.problemas.
-- Texto legado conservado si aparece en CUALQUIER bloque de problemas.
-- Desglose: fallback techumbre / único canaleta|cielo|electrico / ambiguos (2+ keywords).
--
-- PASS cuando filas_texto_no_coincide = 0 y con_texto_sin_json = 0.

WITH hits AS (
  SELECT
    id,
    codigo_filtracion,
    descripcion,
    plan_accion,
    problemas,
    (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'canaleta' AS hay_canaleta,
    (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'cielo' AS hay_cielo,
    (
      (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'electric'
      OR (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'eléctric'
    ) AS hay_electrico,
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
n AS (
  SELECT
    *,
    (hay_canaleta::int + hay_cielo::int + hay_electrico::int) AS n_hits,
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
  FROM hits
)
SELECT
  CASE
    WHEN count(*) FILTER (WHERE problemas IS NOT NULL AND (descripcion_perdida OR plan_perdido)) = 0
     AND count(*) FILTER (WHERE problemas IS NULL AND tiene_texto_legado) = 0
    THEN 'PASS'
    ELSE 'FAIL'
  END AS veredicto,
  count(*)::int AS total_filtraciones,
  count(*) FILTER (WHERE n_hits = 0)::int AS fallback_techumbre,
  count(*) FILTER (WHERE n_hits = 1 AND hay_canaleta)::int AS unico_canaleta,
  count(*) FILTER (WHERE n_hits = 1 AND hay_cielo)::int AS unico_cielo,
  count(*) FILTER (WHERE n_hits = 1 AND hay_electrico)::int AS unico_electrico,
  count(*) FILTER (WHERE n_hits >= 2)::int AS ambiguos,
  count(*) FILTER (
    WHERE problemas IS NOT NULL AND (descripcion_perdida OR plan_perdido)
  )::int AS filas_texto_no_coincide,
  count(*) FILTER (
    WHERE problemas IS NULL AND tiene_texto_legado
  )::int AS con_texto_sin_json
FROM n;
