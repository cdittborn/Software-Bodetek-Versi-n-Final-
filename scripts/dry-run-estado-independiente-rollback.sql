-- DRY-RUN: estado independiente del ejecutor.
-- UNA sesión: BEGIN → remap → verificación fila a fila → ROLLBACK.
-- No contiene COMMIT.

BEGIN;

CREATE TEMP TABLE subs_antes AS
SELECT
  t.id AS trabajo_id,
  t.codigo_filtracion,
  coalesce(nullif(r.codigo, ''), t.titulo) AS recinto,
  k.key AS tipo,
  coalesce(k.value->>'estado', '') AS estado,
  coalesce(
    nullif(k.value->>'ejecutadoPor', ''),
    nullif(k.value->>'ejecutado_por', ''),
    ''
  ) AS ejecutado_por,
  coalesce(k.value->>'descripcion', '') AS descripcion,
  coalesce(k.value->>'plan', '') AS plan,
  coalesce(k.value->>'fechaEntregaEstimada', k.value->>'fecha_entrega_estimada', '') AS fecha_est,
  coalesce(k.value->>'fechaEntregaReal', k.value->>'fecha_entrega_real', '') AS fecha_real,
  coalesce(k.value->>'horasMaestros', k.value->>'horas_maestros', '') AS horas,
  coalesce(k.value->>'proveedorId', k.value->>'proveedor_id', '') AS proveedor_id,
  coalesce(k.value->>'numeroCotizacion', k.value->>'numero_cotizacion', '') AS n_cotizacion,
  coalesce(k.value->>'valorRecinto', k.value->>'valor_recinto', '') AS valor_recinto,
  coalesce(k.value->>'valorTotalCotizacion', k.value->>'valor_total_cotizacion', '') AS valor_total,
  (k.value - 'estado' - 'ejecutadoPor' - 'ejecutado_por') AS resto_json,
  t.descripcion AS ficha_descripcion,
  t.plan_accion AS ficha_plan,
  t.fecha_entrega_estimada AS ficha_fecha_est,
  t.fecha_termino AS ficha_fecha_real,
  t.horas_maestros_bodetek AS ficha_horas,
  t.numero_cotizacion AS ficha_n_cotizacion,
  t.valor_reparacion AS ficha_valor_recinto,
  t.valor_total_cotizacion AS ficha_valor_total,
  t.ejecutado_por AS ficha_ejecutado_por,
  t.estado AS ficha_estado
FROM public.trabajos t
JOIN public.eventos ev ON ev.id = t.evento_id
LEFT JOIN public.recintos r ON r.id = t.recinto_id
CROSS JOIN LATERAL jsonb_each(t.problemas) k
WHERE ev.nombre = 'Temporal 16 ago 2026'
  AND t.problemas IS NOT NULL
  AND jsonb_typeof(t.problemas) = 'object'
  AND k.key IN ('techumbre', 'cielo', 'electrico', 'suciedad_piso')
  AND coalesce(k.value->>'activo', 'false') = 'true';

SELECT 'ANTES_conteo_68'::text AS check, count(*)::int AS n_subproyectos
FROM subs_antes;

SELECT 'ANTES_estados'::text AS check, estado, ejecutado_por, count(*)::int AS n
FROM subs_antes
GROUP BY 2, 3
ORDER BY n DESC, estado, ejecutado_por;

SELECT 'ANTES_estados_ficha'::text AS check, estado, count(*)::int AS n
FROM public.trabajos
WHERE evento_id IS NOT NULL
GROUP BY 2
ORDER BY n DESC;

\echo ''
\echo '========== ANTES: cada subproyecto (Temporal 16 ago 2026) =========='
SELECT
  row_number() OVER (ORDER BY recinto, tipo, trabajo_id) AS n,
  recinto,
  tipo,
  estado AS estado_antes,
  ejecutado_por AS ejecutor_antes,
  left(descripcion, 80) AS descripcion_80,
  left(plan, 80) AS plan_80,
  fecha_est,
  fecha_real,
  horas,
  n_cotizacion,
  valor_recinto,
  valor_total
FROM subs_antes
ORDER BY recinto, tipo, trabajo_id;

-- Helpers (temp: desaparecen al ROLLBACK)
CREATE FUNCTION pg_temp.remap_bloque(b jsonb) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  est text;
  eje text;
BEGIN
  IF b IS NULL OR jsonb_typeof(b) <> 'object' THEN
    RETURN b;
  END IF;
  est := coalesce(b->>'estado', '');
  eje := coalesce(nullif(b->>'ejecutadoPor', ''), nullif(b->>'ejecutado_por', ''), '');
  IF est IN ('asignado_proveedor_en_proceso', 'asignado_maestros_en_proceso') THEN
    est := 'en_proceso';
  ELSIF est = 'terminado' THEN
    est := 'entregado';
  END IF;
  IF est IN ('sin_asignar', '') THEN
    b := jsonb_set(b, '{estado}', to_jsonb(''::text), true);
  ELSIF est = 'asignado_proveedor_sin_empezar' THEN
    b := jsonb_set(b, '{estado}', to_jsonb('sin_empezar'::text), true);
    IF eje = '' THEN
      b := jsonb_set(b, '{ejecutadoPor}', to_jsonb('proveedor_externo'::text), true);
    END IF;
  ELSIF est = 'asignado_maestros_sin_empezar' THEN
    b := jsonb_set(b, '{estado}', to_jsonb('sin_empezar'::text), true);
    IF eje = '' THEN
      b := jsonb_set(b, '{ejecutadoPor}', to_jsonb('maestros_bodetek'::text), true);
    END IF;
  ELSE
    b := jsonb_set(b, '{estado}', to_jsonb(est), true);
  END IF;
  RETURN b;
END;
$$;

CREATE FUNCTION pg_temp.remap_problemas(p jsonb) RETURNS jsonb
LANGUAGE sql AS $$
  SELECT CASE
    WHEN p IS NULL OR jsonb_typeof(p) <> 'object' THEN p
    ELSE (
      SELECT coalesce(jsonb_object_agg(e.key, pg_temp.remap_bloque(e.value)), '{}'::jsonb)
      FROM jsonb_each(p) e
    )
  END
$$;

CREATE FUNCTION pg_temp.estado_agregado(p jsonb) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  min_ord int := 99;
  ord int;
  est text;
  rec record;
  any_activo boolean := false;
BEGIN
  IF p IS NULL OR jsonb_typeof(p) <> 'object' THEN
    RETURN '';
  END IF;
  FOR rec IN SELECT value FROM jsonb_each(p)
  LOOP
    IF coalesce(rec.value->>'activo', 'false') <> 'true' THEN
      CONTINUE;
    END IF;
    any_activo := true;
    est := coalesce(rec.value->>'estado', '');
    ord := CASE est
      WHEN '' THEN 0
      WHEN 'sin_empezar' THEN 1
      WHEN 'en_proceso' THEN 2
      WHEN 'ejecutado_pendiente_entrega' THEN 3
      WHEN 'entregado' THEN 4
      ELSE 0
    END;
    IF ord < min_ord THEN min_ord := ord; END IF;
  END LOOP;
  IF NOT any_activo THEN RETURN ''; END IF;
  RETURN CASE min_ord
    WHEN 0 THEN ''
    WHEN 1 THEN 'sin_empezar'
    WHEN 2 THEN 'en_proceso'
    WHEN 3 THEN 'ejecutado_pendiente_entrega'
    WHEN 4 THEN 'entregado'
    ELSE ''
  END;
END;
$$;

ALTER TABLE public.trabajos DROP CONSTRAINT IF EXISTS trabajos_estado_check;
ALTER TABLE public.trabajos ADD CONSTRAINT trabajos_estado_check CHECK (
  estado IN (
    'planificado', 'en_curso', 'completado', 'mantencion_periodica',
    'pendiente', 'en_proceso', 'terminado',
    '', 'sin_empezar', 'ejecutado_pendiente_entrega', 'entregado',
    'sin_asignar', 'asignado_proveedor_sin_empezar', 'asignado_maestros_sin_empezar',
    'asignado_proveedor_en_proceso', 'asignado_maestros_en_proceso'
  )
);

UPDATE public.trabajos t
SET
  problemas = pg_temp.remap_problemas(t.problemas),
  estado = pg_temp.estado_agregado(pg_temp.remap_problemas(t.problemas))
WHERE t.evento_id IS NOT NULL
  AND t.problemas IS NOT NULL
  AND jsonb_typeof(t.problemas) = 'object';

CREATE TEMP TABLE subs_despues AS
SELECT
  t.id AS trabajo_id,
  t.codigo_filtracion,
  coalesce(nullif(r.codigo, ''), t.titulo) AS recinto,
  k.key AS tipo,
  coalesce(k.value->>'estado', '') AS estado,
  coalesce(
    nullif(k.value->>'ejecutadoPor', ''),
    nullif(k.value->>'ejecutado_por', ''),
    ''
  ) AS ejecutado_por,
  coalesce(k.value->>'descripcion', '') AS descripcion,
  coalesce(k.value->>'plan', '') AS plan,
  coalesce(k.value->>'fechaEntregaEstimada', k.value->>'fecha_entrega_estimada', '') AS fecha_est,
  coalesce(k.value->>'fechaEntregaReal', k.value->>'fecha_entrega_real', '') AS fecha_real,
  coalesce(k.value->>'horasMaestros', k.value->>'horas_maestros', '') AS horas,
  coalesce(k.value->>'proveedorId', k.value->>'proveedor_id', '') AS proveedor_id,
  coalesce(k.value->>'numeroCotizacion', k.value->>'numero_cotizacion', '') AS n_cotizacion,
  coalesce(k.value->>'valorRecinto', k.value->>'valor_recinto', '') AS valor_recinto,
  coalesce(k.value->>'valorTotalCotizacion', k.value->>'valor_total_cotizacion', '') AS valor_total,
  (k.value - 'estado' - 'ejecutadoPor' - 'ejecutado_por') AS resto_json,
  t.descripcion AS ficha_descripcion,
  t.plan_accion AS ficha_plan,
  t.fecha_entrega_estimada AS ficha_fecha_est,
  t.fecha_termino AS ficha_fecha_real,
  t.horas_maestros_bodetek AS ficha_horas,
  t.numero_cotizacion AS ficha_n_cotizacion,
  t.valor_reparacion AS ficha_valor_recinto,
  t.valor_total_cotizacion AS ficha_valor_total,
  t.ejecutado_por AS ficha_ejecutado_por,
  t.estado AS ficha_estado
FROM public.trabajos t
JOIN public.eventos ev ON ev.id = t.evento_id
LEFT JOIN public.recintos r ON r.id = t.recinto_id
CROSS JOIN LATERAL jsonb_each(t.problemas) k
WHERE ev.nombre = 'Temporal 16 ago 2026'
  AND t.problemas IS NOT NULL
  AND jsonb_typeof(t.problemas) = 'object'
  AND k.key IN ('techumbre', 'cielo', 'electrico', 'suciedad_piso')
  AND coalesce(k.value->>'activo', 'false') = 'true';

\echo ''
\echo '========== DESPUÉS: cada subproyecto =========='
SELECT
  row_number() OVER (ORDER BY recinto, tipo, trabajo_id) AS n,
  recinto,
  tipo,
  estado AS estado_despues,
  ejecutado_por AS ejecutor_despues,
  left(descripcion, 80) AS descripcion_80,
  left(plan, 80) AS plan_80,
  fecha_est,
  fecha_real,
  horas,
  n_cotizacion,
  valor_recinto,
  valor_total
FROM subs_despues
ORDER BY recinto, tipo, trabajo_id;

\echo ''
\echo '========== ANTES vs DESPUÉS (fila a fila) =========='
SELECT
  row_number() OVER (ORDER BY a.recinto, a.tipo, a.trabajo_id) AS n,
  a.recinto,
  a.tipo,
  a.estado AS estado_antes,
  d.estado AS estado_despues,
  a.ejecutado_por AS ejecutor_antes,
  d.ejecutado_por AS ejecutor_despues,
  CASE
    WHEN a.estado IN ('sin_asignar', '') AND d.estado = ''
      AND a.ejecutado_por = d.ejecutado_por THEN 'ok_vacio'
    WHEN a.estado = 'asignado_proveedor_sin_empezar' AND d.estado = 'sin_empezar'
      AND d.ejecutado_por = CASE WHEN a.ejecutado_por = '' THEN 'proveedor_externo' ELSE a.ejecutado_por END
      THEN 'ok_sin_empezar_prov'
    WHEN a.estado = 'asignado_maestros_sin_empezar' AND d.estado = 'sin_empezar'
      AND d.ejecutado_por = CASE WHEN a.ejecutado_por = '' THEN 'maestros_bodetek' ELSE a.ejecutado_por END
      THEN 'ok_sin_empezar_mae'
    WHEN a.estado = 'en_proceso' AND d.estado = 'en_proceso'
      AND a.ejecutado_por = d.ejecutado_por THEN 'ok_en_proceso'
    WHEN a.estado = 'ejecutado_pendiente_entrega' AND d.estado = 'ejecutado_pendiente_entrega'
      AND a.ejecutado_por = d.ejecutado_por THEN 'ok_ejecutado'
    WHEN a.estado = 'entregado' AND d.estado = 'entregado'
      AND a.ejecutado_por = d.ejecutado_por THEN 'ok_entregado'
    ELSE 'FALLO_MAPEO'
  END AS mapeo,
  (a.descripcion = d.descripcion
    AND a.plan = d.plan
    AND a.fecha_est = d.fecha_est
    AND a.fecha_real = d.fecha_real
    AND a.horas = d.horas
    AND a.proveedor_id = d.proveedor_id
    AND a.n_cotizacion = d.n_cotizacion
    AND a.valor_recinto = d.valor_recinto
    AND a.valor_total = d.valor_total
    AND a.resto_json = d.resto_json
    AND a.ficha_descripcion IS NOT DISTINCT FROM d.ficha_descripcion
    AND a.ficha_plan IS NOT DISTINCT FROM d.ficha_plan
    AND a.ficha_fecha_est IS NOT DISTINCT FROM d.ficha_fecha_est
    AND a.ficha_fecha_real IS NOT DISTINCT FROM d.ficha_fecha_real
    AND a.ficha_horas IS NOT DISTINCT FROM d.ficha_horas
    AND a.ficha_n_cotizacion IS NOT DISTINCT FROM d.ficha_n_cotizacion
    AND a.ficha_valor_recinto IS NOT DISTINCT FROM d.ficha_valor_recinto
    AND a.ficha_valor_total IS NOT DISTINCT FROM d.ficha_valor_total
    AND a.ficha_ejecutado_por IS NOT DISTINCT FROM d.ficha_ejecutado_por
  ) AS textos_y_resto_iguales,
  CASE
    WHEN a.estado = 'asignado_maestros_sin_empezar'
      AND a.ejecutado_por = 'proveedor_externo' THEN 'CRUZADO'
    ELSE ''
  END AS nota
FROM subs_antes a
JOIN subs_despues d
  ON a.trabajo_id = d.trabajo_id AND a.tipo = d.tipo
ORDER BY a.recinto, a.tipo, a.trabajo_id;

SELECT 'RESUMEN_mapeo'::text AS check, mapeo, count(*)::int AS n
FROM (
  SELECT
    CASE
      WHEN a.estado IN ('sin_asignar', '') AND d.estado = ''
        AND a.ejecutado_por = d.ejecutado_por THEN 'ok_vacio'
      WHEN a.estado = 'asignado_proveedor_sin_empezar' AND d.estado = 'sin_empezar'
        AND d.ejecutado_por = CASE WHEN a.ejecutado_por = '' THEN 'proveedor_externo' ELSE a.ejecutado_por END
        THEN 'ok_sin_empezar_prov'
      WHEN a.estado = 'asignado_maestros_sin_empezar' AND d.estado = 'sin_empezar'
        AND d.ejecutado_por = CASE WHEN a.ejecutado_por = '' THEN 'maestros_bodetek' ELSE a.ejecutado_por END
        THEN 'ok_sin_empezar_mae'
      WHEN a.estado = 'en_proceso' AND d.estado = 'en_proceso'
        AND a.ejecutado_por = d.ejecutado_por THEN 'ok_en_proceso'
      WHEN a.estado = 'ejecutado_pendiente_entrega' AND d.estado = 'ejecutado_pendiente_entrega'
        AND a.ejecutado_por = d.ejecutado_por THEN 'ok_ejecutado'
      WHEN a.estado = 'entregado' AND d.estado = 'entregado'
        AND a.ejecutado_por = d.ejecutado_por THEN 'ok_entregado'
      ELSE 'FALLO_MAPEO'
    END AS mapeo
  FROM subs_antes a
  JOIN subs_despues d ON a.trabajo_id = d.trabajo_id AND a.tipo = d.tipo
) s
GROUP BY 2
ORDER BY n DESC;

SELECT 'FALLOS'::text AS check, count(*)::int AS n_fallo_mapeo
FROM subs_antes a
JOIN subs_despues d ON a.trabajo_id = d.trabajo_id AND a.tipo = d.tipo
WHERE NOT (
  (a.estado IN ('sin_asignar', '') AND d.estado = '' AND a.ejecutado_por = d.ejecutado_por)
  OR (a.estado = 'asignado_proveedor_sin_empezar' AND d.estado = 'sin_empezar'
      AND d.ejecutado_por = CASE WHEN a.ejecutado_por = '' THEN 'proveedor_externo' ELSE a.ejecutado_por END)
  OR (a.estado = 'asignado_maestros_sin_empezar' AND d.estado = 'sin_empezar'
      AND d.ejecutado_por = CASE WHEN a.ejecutado_por = '' THEN 'maestros_bodetek' ELSE a.ejecutado_por END)
  OR (a.estado = 'en_proceso' AND d.estado = 'en_proceso' AND a.ejecutado_por = d.ejecutado_por)
  OR (a.estado = 'ejecutado_pendiente_entrega' AND d.estado = 'ejecutado_pendiente_entrega' AND a.ejecutado_por = d.ejecutado_por)
  OR (a.estado = 'entregado' AND d.estado = 'entregado' AND a.ejecutado_por = d.ejecutado_por)
);

SELECT 'TEXTOS_ROTO'::text AS check, count(*)::int AS n_textos_cambiaron
FROM subs_antes a
JOIN subs_despues d ON a.trabajo_id = d.trabajo_id AND a.tipo = d.tipo
WHERE NOT (
  a.descripcion = d.descripcion
  AND a.plan = d.plan
  AND a.fecha_est = d.fecha_est
  AND a.fecha_real = d.fecha_real
  AND a.horas = d.horas
  AND a.proveedor_id = d.proveedor_id
  AND a.n_cotizacion = d.n_cotizacion
  AND a.valor_recinto = d.valor_recinto
  AND a.valor_total = d.valor_total
  AND a.resto_json = d.resto_json
);

SELECT 'CONTEOS'::text AS check,
  (SELECT count(*) FROM subs_antes) AS n_antes,
  (SELECT count(*) FROM subs_despues) AS n_despues,
  (SELECT count(*) FROM subs_antes a
    FULL OUTER JOIN subs_despues d ON a.trabajo_id = d.trabajo_id AND a.tipo = d.tipo
    WHERE a.trabajo_id IS NULL OR d.trabajo_id IS NULL) AS n_filas_perdidas_o_nuevas;

SELECT 'DESPUES_estados'::text AS check, estado, ejecutado_por, count(*)::int AS n
FROM subs_despues
GROUP BY 2, 3
ORDER BY n DESC, estado, ejecutado_por;

SELECT 'legado_restante_en_json'::text AS check, count(*)::int AS n
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

SELECT 'ficha_estados_legado_restante'::text AS check, estado, count(*)::int AS n
FROM public.trabajos
WHERE estado IN (
  'sin_asignar',
  'asignado_proveedor_sin_empezar',
  'asignado_maestros_sin_empezar',
  'asignado_proveedor_en_proceso',
  'asignado_maestros_en_proceso'
)
GROUP BY 2;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.trabajos
    WHERE estado IN (
      'sin_asignar',
      'asignado_proveedor_sin_empezar',
      'asignado_maestros_sin_empezar',
      'asignado_proveedor_en_proceso',
      'asignado_maestros_en_proceso'
    )
  ) THEN
    ALTER TABLE public.trabajos DROP CONSTRAINT IF EXISTS trabajos_estado_check;
    ALTER TABLE public.trabajos ADD CONSTRAINT trabajos_estado_check CHECK (
      estado IN (
        'planificado', 'en_curso', 'completado', 'mantencion_periodica',
        'pendiente', 'en_proceso', 'terminado',
        '', 'sin_empezar', 'ejecutado_pendiente_entrega', 'entregado'
      )
    );
    RAISE NOTICE 'check constraint reducido al modelo nuevo';
  ELSE
    RAISE NOTICE 'check constraint NO se redujo: quedan estados legado en trabajos.estado';
  END IF;
END $$;

ROLLBACK;
