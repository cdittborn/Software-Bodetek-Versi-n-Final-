-- Muestra post-migración: tipo(s) activos, flag ambiguo, texto conservado.

SELECT
  codigo_filtracion,
  concat_ws(
    '+',
    CASE WHEN problemas -> 'techumbre' ->> 'activo' = 'true' THEN 'techumbre' END,
    CASE WHEN problemas -> 'canaleta' ->> 'activo' = 'true' THEN 'canaleta' END,
    CASE WHEN problemas -> 'cielo' ->> 'activo' = 'true' THEN 'cielo' END,
    CASE WHEN problemas -> 'electrico' ->> 'activo' = 'true' THEN 'electrico' END
  ) AS tipos_activos,
  (
    ((coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'canaleta')::int
    + ((coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'cielo')::int
    + (
      (
        (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'electric'
        OR (coalesce(descripcion, '') || E'\n' || coalesce(plan_accion, '')) ~* 'eléctric'
      )::int
    )
  ) >= 2 AS ambiguo,
  left(coalesce(descripcion, ''), 80) AS descripcion_antes,
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
ORDER BY ambiguo DESC, codigo_filtracion
LIMIT 30;
