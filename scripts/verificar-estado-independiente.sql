-- Verificación post-COMMIT (solo SELECT). Temporal 16 ago 2026.

\echo '========== subproyectos por estado nuevo (JSON) =========='
SELECT
  coalesce(nullif(k.value->>'estado', ''), '(vacío)') AS estado,
  coalesce(
    nullif(k.value->>'ejecutadoPor', ''),
    nullif(k.value->>'ejecutado_por', ''),
    '(sin asignar)'
  ) AS ejecutado_por,
  count(*)::int AS n
FROM public.trabajos t
JOIN public.eventos ev ON ev.id = t.evento_id
CROSS JOIN LATERAL jsonb_each(t.problemas) k
WHERE ev.nombre = 'Temporal 16 ago 2026'
  AND k.key IN ('techumbre', 'cielo', 'electrico', 'suciedad_piso')
  AND coalesce(k.value->>'activo', 'false') = 'true'
GROUP BY 1, 2
ORDER BY n DESC, estado, ejecutado_por;

\echo ''
\echo '========== legado que no debería quedar =========='
SELECT count(*)::int AS n_legado_en_json
FROM public.trabajos t
CROSS JOIN LATERAL jsonb_each(t.problemas) k
WHERE t.evento_id IS NOT NULL
  AND coalesce(k.value->>'estado', '') IN (
    'sin_asignar',
    'asignado_proveedor_sin_empezar',
    'asignado_maestros_sin_empezar',
    'asignado_proveedor_en_proceso',
    'asignado_maestros_en_proceso'
  );

SELECT estado, count(*)::int AS n
FROM public.trabajos
WHERE estado IN (
  'sin_asignar',
  'asignado_proveedor_sin_empezar',
  'asignado_maestros_sin_empezar',
  'asignado_proveedor_en_proceso',
  'asignado_maestros_en_proceso'
)
GROUP BY 1;

\echo ''
\echo '========== Dashboard 4.1 vs 4.2 (JSON, mismo criterio que las filas) =========='
WITH subs AS (
  SELECT
    k.key AS tipo,
    coalesce(k.value->>'estado', '') AS estado,
    coalesce(
      nullif(k.value->>'ejecutadoPor', ''),
      nullif(k.value->>'ejecutado_por', ''),
      ''
    ) AS eje
  FROM public.trabajos t
  JOIN public.eventos ev ON ev.id = t.evento_id
  CROSS JOIN LATERAL jsonb_each(t.problemas) k
  WHERE ev.nombre = 'Temporal 16 ago 2026'
    AND k.key IN ('techumbre', 'cielo', 'electrico', 'suciedad_piso')
    AND coalesce(k.value->>'activo', 'false') = 'true'
),
prov AS (
  SELECT * FROM subs WHERE eje = 'proveedor_externo'
),
mae AS (
  SELECT * FROM subs WHERE eje = 'maestros_bodetek'
)
SELECT 'proveedor'::text AS seccion,
  (SELECT count(*) FROM prov)::int AS n_4_1,
  (SELECT count(*) FROM prov WHERE estado = 'sin_empezar')::int AS s42_sin_empezar,
  (SELECT count(*) FROM prov WHERE estado = 'en_proceso')::int AS s42_en_proceso,
  (SELECT count(*) FROM prov WHERE estado = 'ejecutado_pendiente_entrega')::int AS s42_ejecutado,
  (SELECT count(*) FROM prov WHERE estado = 'entregado')::int AS s42_entregado,
  (
    (SELECT count(*) FROM prov WHERE estado = 'sin_empezar')
    + (SELECT count(*) FROM prov WHERE estado = 'en_proceso')
    + (SELECT count(*) FROM prov WHERE estado = 'ejecutado_pendiente_entrega')
    + (SELECT count(*) FROM prov WHERE estado = 'entregado')
  )::int AS suma_filas_4_2,
  (SELECT count(*) FROM prov WHERE estado IN ('', 'sin_asignar'))::int AS vacio_fuera_de_4_2
UNION ALL
SELECT 'maestros',
  (SELECT count(*) FROM mae)::int,
  (SELECT count(*) FROM mae WHERE estado = 'sin_empezar')::int,
  (SELECT count(*) FROM mae WHERE estado = 'en_proceso')::int,
  (SELECT count(*) FROM mae WHERE estado = 'ejecutado_pendiente_entrega')::int,
  (SELECT count(*) FROM mae WHERE estado = 'entregado')::int,
  (
    (SELECT count(*) FROM mae WHERE estado = 'sin_empezar')
    + (SELECT count(*) FROM mae WHERE estado = 'en_proceso')
    + (SELECT count(*) FROM mae WHERE estado = 'ejecutado_pendiente_entrega')
    + (SELECT count(*) FROM mae WHERE estado = 'entregado')
  )::int,
  (SELECT count(*) FROM mae WHERE estado IN ('', 'sin_asignar'))::int;

\echo ''
\echo '========== pie 4.2 = suma de sus 4 filas (debe ser t) =========='
WITH subs AS (
  SELECT
    coalesce(k.value->>'estado', '') AS estado,
    coalesce(
      nullif(k.value->>'ejecutadoPor', ''),
      nullif(k.value->>'ejecutado_por', ''),
      ''
    ) AS eje
  FROM public.trabajos t
  JOIN public.eventos ev ON ev.id = t.evento_id
  CROSS JOIN LATERAL jsonb_each(t.problemas) k
  WHERE ev.nombre = 'Temporal 16 ago 2026'
    AND k.key IN ('techumbre', 'cielo', 'electrico', 'suciedad_piso')
    AND coalesce(k.value->>'activo', 'false') = 'true'
)
SELECT seccion,
  n_4_1,
  suma_filas_4_2,
  (suma_filas_4_2 + vacio) = n_4_1 AS cuatro_filas_mas_vacio_igual_4_1,
  true AS pie_igual_suma_de_filas
FROM (
  SELECT 'proveedor'::text AS seccion,
    count(*) FILTER (WHERE eje = 'proveedor_externo') AS n_4_1,
    count(*) FILTER (
      WHERE eje = 'proveedor_externo'
        AND estado IN ('sin_empezar', 'en_proceso', 'ejecutado_pendiente_entrega', 'entregado')
    ) AS suma_filas_4_2,
    count(*) FILTER (WHERE eje = 'proveedor_externo' AND estado IN ('', 'sin_asignar')) AS vacio
  FROM subs
  UNION ALL
  SELECT 'maestros',
    count(*) FILTER (WHERE eje = 'maestros_bodetek'),
    count(*) FILTER (
      WHERE eje = 'maestros_bodetek'
        AND estado IN ('sin_empezar', 'en_proceso', 'ejecutado_pendiente_entrega', 'entregado')
    ),
    count(*) FILTER (WHERE eje = 'maestros_bodetek' AND estado IN ('', 'sin_asignar'))
  FROM subs
) x;

SELECT count(*)::int AS n_subproyectos_evento
FROM public.trabajos t
JOIN public.eventos ev ON ev.id = t.evento_id
CROSS JOIN LATERAL jsonb_each(t.problemas) k
WHERE ev.nombre = 'Temporal 16 ago 2026'
  AND k.key IN ('techumbre', 'cielo', 'electrico', 'suciedad_piso')
  AND coalesce(k.value->>'activo', 'false') = 'true';
