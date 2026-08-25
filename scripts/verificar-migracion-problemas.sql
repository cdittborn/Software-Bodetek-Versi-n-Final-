-- Verificación post-migración. Texto conservado si aparece en algún bloque.
-- Desglose: fallback techumbre vs. único confirmado vs. ambiguos.

WITH n AS (
  SELECT
    descripcion,
    plan_accion,
    problemas,
    blob ~* 'techumbre' AS hay_techumbre,
    blob ~* 'canaleta' AS hay_canaleta,
    blob ~* 'cielo' AS hay_cielo,
    (blob ~* 'electric' OR blob ~* 'eléctric') AS hay_electrico,
    (
      (blob ~* 'techumbre')::int
      + (blob ~* 'canaleta')::int
      + (blob ~* 'cielo')::int
      + ((blob ~* 'electric' OR blob ~* 'eléctric')::int)
    ) AS n_hits,
    coalesce(problemas -> 'techumbre' ->> 'descripcion', '') AS d_techumbre,
    coalesce(problemas -> 'canaleta' ->> 'descripcion', '') AS d_canaleta,
    coalesce(problemas -> 'cielo' ->> 'descripcion', '') AS d_cielo,
    coalesce(problemas -> 'electrico' ->> 'descripcion', '') AS d_electrico,
    coalesce(problemas -> 'techumbre' ->> 'plan', '') AS p_techumbre,
    coalesce(problemas -> 'canaleta' ->> 'plan', '') AS p_canaleta,
    coalesce(problemas -> 'cielo' ->> 'plan', '') AS p_cielo,
    coalesce(problemas -> 'electrico' ->> 'plan', '') AS p_electrico
  FROM (
    SELECT
      descripcion,
      plan_accion,
      problemas,
      regexp_replace(
        coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, ''),
        'cielos?\s+americanos?',
        ' ',
        'gi'
      ) AS blob
    FROM public.trabajos
    WHERE evento_id IS NOT NULL
  ) s
)
SELECT
  CASE
    WHEN count(*) FILTER (
      WHERE problemas IS NOT NULL
        AND (
          (coalesce(descripcion, '') <> '' AND coalesce(descripcion, '') NOT IN (d_techumbre, d_canaleta, d_cielo, d_electrico))
          OR (coalesce(plan_accion, '') <> '' AND coalesce(plan_accion, '') NOT IN (p_techumbre, p_canaleta, p_cielo, p_electrico))
        )
    ) = 0
     AND count(*) FILTER (
      WHERE problemas IS NULL
        AND (coalesce(btrim(descripcion), '') <> '' OR coalesce(btrim(plan_accion), '') <> '')
    ) = 0
    THEN 'PASS'
    ELSE 'FAIL'
  END AS veredicto,
  count(*)::int AS total_filtraciones,
  count(*) FILTER (WHERE n_hits = 0)::int AS fallback_techumbre,
  count(*) FILTER (WHERE n_hits = 1 AND hay_techumbre)::int AS unico_techumbre,
  count(*) FILTER (WHERE n_hits = 1 AND hay_canaleta)::int AS unico_canaleta,
  count(*) FILTER (WHERE n_hits = 1 AND hay_cielo)::int AS unico_cielo,
  count(*) FILTER (WHERE n_hits = 1 AND hay_electrico)::int AS unico_electrico,
  count(*) FILTER (WHERE n_hits >= 2)::int AS ambiguos
FROM n;
