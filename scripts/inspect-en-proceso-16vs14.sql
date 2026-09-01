-- Lectura: ¿16 vs 14 «En proceso» es edición en vivo o hidratación desde la ficha?
-- No escribe nada.

\echo '========== fichas del evento, updated_at más reciente primero =========='
SELECT
  coalesce(nullif(r.codigo, ''), t.titulo) AS recinto,
  t.estado AS estado_ficha,
  t.ejecutado_por AS ejecutor_ficha,
  t.updated_at,
  t.created_at,
  (now() - t.updated_at) AS hace
FROM public.trabajos t
JOIN public.eventos ev ON ev.id = t.evento_id
LEFT JOIN public.recintos r ON r.id = t.recinto_id
WHERE ev.nombre = 'Temporal 16 ago 2026'
ORDER BY t.updated_at DESC NULLS LAST;

\echo ''
\echo '========== bloques activos: JSON vs lo que el Dashboard hidrata desde la ficha =========='
SELECT
  coalesce(nullif(r.codigo, ''), t.titulo) AS recinto,
  k.key AS tipo,
  coalesce(k.value->>'estado', '') AS estado_json,
  coalesce(nullif(k.value->>'ejecutadoPor', ''), nullif(k.value->>'ejecutado_por', ''), '') AS ejecutor_json,
  t.estado AS estado_ficha,
  t.ejecutado_por AS ejecutor_ficha,
  CASE
    WHEN coalesce(k.value->>'estado', '') IN ('', 'sin_asignar')
      AND t.estado IN (
        'en_proceso',
        'asignado_proveedor_en_proceso',
        'asignado_maestros_en_proceso'
      )
      THEN 'HIDRATA_A_EN_PROCESO'
    WHEN coalesce(k.value->>'estado', '') IN (
      'en_proceso',
      'asignado_proveedor_en_proceso',
      'asignado_maestros_en_proceso'
    )
      THEN 'EN_PROCESO_EN_JSON'
    ELSE ''
  END AS nota,
  t.updated_at
FROM public.trabajos t
JOIN public.eventos ev ON ev.id = t.evento_id
LEFT JOIN public.recintos r ON r.id = t.recinto_id
CROSS JOIN LATERAL jsonb_each(t.problemas) k
WHERE ev.nombre = 'Temporal 16 ago 2026'
  AND k.key IN ('techumbre', 'cielo', 'electrico', 'suciedad_piso')
  AND coalesce(k.value->>'activo', 'false') = 'true'
  AND (
    coalesce(k.value->>'estado', '') IN (
      'en_proceso',
      'asignado_proveedor_en_proceso',
      'asignado_maestros_en_proceso'
    )
    OR (
      coalesce(k.value->>'estado', '') IN ('', 'sin_asignar')
      AND t.estado IN (
        'en_proceso',
        'asignado_proveedor_en_proceso',
        'asignado_maestros_en_proceso'
      )
    )
  )
ORDER BY recinto, tipo;

\echo ''
\echo '========== conteo En proceso: JSON vs hidratado (proveedor) =========='
SELECT
  count(*) FILTER (
    WHERE coalesce(k.value->>'estado', '') IN (
      'en_proceso', 'asignado_proveedor_en_proceso', 'asignado_maestros_en_proceso'
    )
    AND coalesce(nullif(k.value->>'ejecutadoPor', ''), nullif(k.value->>'ejecutado_por', ''), '') = 'proveedor_externo'
  )::int AS en_proceso_json_proveedor,
  count(*) FILTER (
    WHERE coalesce(nullif(k.value->>'ejecutadoPor', ''), nullif(k.value->>'ejecutado_por', ''), t.ejecutado_por, '') = 'proveedor_externo'
      AND (
        CASE
          WHEN coalesce(k.value->>'estado', '') IN ('', 'sin_asignar')
            THEN t.estado
          ELSE coalesce(k.value->>'estado', '')
        END
      ) IN (
        'en_proceso',
        'asignado_proveedor_en_proceso',
        'asignado_maestros_en_proceso'
      )
  )::int AS en_proceso_hidratado_proveedor
FROM public.trabajos t
JOIN public.eventos ev ON ev.id = t.evento_id
CROSS JOIN LATERAL jsonb_each(t.problemas) k
WHERE ev.nombre = 'Temporal 16 ago 2026'
  AND k.key IN ('techumbre', 'cielo', 'electrico', 'suciedad_piso')
  AND coalesce(k.value->>'activo', 'false') = 'true';
