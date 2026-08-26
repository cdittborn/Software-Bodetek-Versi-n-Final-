-- DRY-RUN: quitar tipo Canaleta (absorber en Techumbre) + ajustar check de
-- trabajo_media.problema_tipo.
-- TERMINA EN ROLLBACK. No persistir sin confirmación explícita.

BEGIN;

CREATE TEMP TABLE canaleta_ids AS
SELECT id, codigo_filtracion
FROM public.trabajos
WHERE problemas -> 'canaleta' ->> 'activo' = 'true';

SELECT 'ANTES' AS momento,
  count(*) FILTER (WHERE problemas ? 'canaleta') AS clave_canaleta,
  count(*) FILTER (WHERE problemas -> 'canaleta' ->> 'activo' = 'true') AS canaleta_activa,
  count(*) FILTER (WHERE problemas -> 'techumbre' ->> 'activo' = 'true') AS techumbre_activa
FROM public.trabajos
WHERE problemas IS NOT NULL;

SELECT t.codigo_filtracion,
  problemas -> 'techumbre' ->> 'activo' AS tech_activo_antes,
  left(coalesce(problemas -> 'techumbre' ->> 'descripcion', ''), 80) AS tech_desc_antes,
  problemas -> 'canaleta' ->> 'activo' AS can_activo_antes,
  left(coalesce(problemas -> 'canaleta' ->> 'descripcion', ''), 80) AS can_desc_antes
FROM public.trabajos t
WHERE problemas -> 'canaleta' ->> 'activo' = 'true'
ORDER BY t.codigo_filtracion;

SELECT COALESCE(problema_tipo, '(null)') AS problema_tipo, count(*) AS n
FROM public.trabajo_media
GROUP BY 1;

UPDATE public.trabajos t
SET problemas = (t.problemas - 'canaleta') || jsonb_build_object(
  'techumbre',
  jsonb_build_object(
    'activo',
      (coalesce(t.problemas #>> '{techumbre,activo}', 'false') = 'true')
      OR (coalesce(t.problemas #>> '{canaleta,activo}', 'false') = 'true'),
    'descripcion',
      CASE
        WHEN coalesce(t.problemas #>> '{techumbre,descripcion}', '') = ''
          THEN coalesce(t.problemas #>> '{canaleta,descripcion}', '')
        WHEN coalesce(t.problemas #>> '{canaleta,descripcion}', '') IN (
          '',
          coalesce(t.problemas #>> '{techumbre,descripcion}', '')
        )
          THEN coalesce(t.problemas #>> '{techumbre,descripcion}', '')
        ELSE (t.problemas #>> '{techumbre,descripcion}')
          || E'\n\n' || (t.problemas #>> '{canaleta,descripcion}')
      END,
    'plan',
      CASE
        WHEN coalesce(t.problemas #>> '{techumbre,plan}', '') = ''
          THEN coalesce(t.problemas #>> '{canaleta,plan}', '')
        WHEN coalesce(t.problemas #>> '{canaleta,plan}', '') IN (
          '',
          coalesce(t.problemas #>> '{techumbre,plan}', '')
        )
          THEN coalesce(t.problemas #>> '{techumbre,plan}', '')
        ELSE (t.problemas #>> '{techumbre,plan}')
          || E'\n\n' || (t.problemas #>> '{canaleta,plan}')
      END,
    'ejecutadoPor',
      coalesce(
        nullif(t.problemas #>> '{techumbre,ejecutadoPor}', ''),
        t.problemas #>> '{canaleta,ejecutadoPor}',
        ''
      ),
    'estado',
      CASE
        WHEN coalesce(t.problemas #>> '{techumbre,estado}', 'sin_asignar')
          NOT IN ('', 'sin_asignar')
          THEN t.problemas #>> '{techumbre,estado}'
        ELSE coalesce(t.problemas #>> '{canaleta,estado}', 'sin_asignar')
      END,
    'fechaEntregaEstimada',
      CASE
        WHEN coalesce(t.problemas #>> '{techumbre,fechaEntregaEstimada}', '')
          >= coalesce(t.problemas #>> '{canaleta,fechaEntregaEstimada}', '')
          THEN coalesce(t.problemas #>> '{techumbre,fechaEntregaEstimada}', '')
        ELSE coalesce(t.problemas #>> '{canaleta,fechaEntregaEstimada}', '')
      END,
    'fechaEntregaReal',
      CASE
        WHEN coalesce(t.problemas #>> '{techumbre,fechaEntregaReal}', '')
          >= coalesce(t.problemas #>> '{canaleta,fechaEntregaReal}', '')
          THEN coalesce(t.problemas #>> '{techumbre,fechaEntregaReal}', '')
        ELSE coalesce(t.problemas #>> '{canaleta,fechaEntregaReal}', '')
      END,
    'horasMaestros',
      coalesce(
        nullif(t.problemas #>> '{techumbre,horasMaestros}', ''),
        t.problemas #>> '{canaleta,horasMaestros}',
        ''
      ),
    'proveedorId',
      coalesce(
        nullif(t.problemas #>> '{techumbre,proveedorId}', ''),
        t.problemas #>> '{canaleta,proveedorId}',
        ''
      ),
    'numeroCotizacion',
      coalesce(
        nullif(t.problemas #>> '{techumbre,numeroCotizacion}', ''),
        t.problemas #>> '{canaleta,numeroCotizacion}',
        ''
      ),
    'valorRecinto',
      coalesce(
        nullif(t.problemas #>> '{techumbre,valorRecinto}', ''),
        t.problemas #>> '{canaleta,valorRecinto}',
        ''
      ),
    'valorTotalCotizacion',
      coalesce(
        nullif(t.problemas #>> '{techumbre,valorTotalCotizacion}', ''),
        t.problemas #>> '{canaleta,valorTotalCotizacion}',
        ''
      )
  )
)
WHERE t.problemas ? 'canaleta';

UPDATE public.trabajo_media
SET problema_tipo = 'techumbre'
WHERE problema_tipo = 'canaleta';

ALTER TABLE public.trabajo_media
  DROP CONSTRAINT IF EXISTS trabajo_media_problema_tipo_check;

ALTER TABLE public.trabajo_media
  ADD CONSTRAINT trabajo_media_problema_tipo_check
  CHECK (
    problema_tipo IS NULL
    OR problema_tipo IN (
      'techumbre',
      'cielo',
      'electrico',
      'suciedad_piso'
    )
  );

COMMENT ON COLUMN public.trabajos.problemas IS
  'Bloques por tipo (techumbre|cielo|electrico|suciedad_piso). Canaleta legado se absorbe en techumbre.';

-- ========== DESPUÉS (aún sin COMMIT) ==========
SELECT 'DESPUES_EN_TX' AS momento,
  count(*) FILTER (WHERE problemas ? 'canaleta') AS clave_canaleta,
  count(*) FILTER (WHERE problemas -> 'canaleta' ->> 'activo' = 'true') AS canaleta_activa,
  count(*) FILTER (WHERE problemas -> 'techumbre' ->> 'activo' = 'true') AS techumbre_activa,
  count(*) FILTER (WHERE problemas IS NULL) AS problemas_null
FROM public.trabajos;

SELECT t.codigo_filtracion,
  problemas -> 'techumbre' ->> 'activo' AS tech_activo_despues,
  left(coalesce(problemas -> 'techumbre' ->> 'descripcion', ''), 120) AS tech_desc_despues,
  (problemas ? 'canaleta') AS sigue_clave_canaleta
FROM public.trabajos t
JOIN canaleta_ids c ON c.id = t.id
ORDER BY t.codigo_filtracion;

SELECT pg_get_constraintdef(oid) AS check_problema_tipo
FROM pg_constraint
WHERE conrelid = 'public.trabajo_media'::regclass
  AND conname = 'trabajo_media_problema_tipo_check';

ROLLBACK;

-- Confirmación de que nada persistió
SELECT 'DESPUES_ROLLBACK' AS momento,
  count(*) FILTER (WHERE problemas ? 'canaleta') AS clave_canaleta,
  count(*) FILTER (WHERE problemas -> 'canaleta' ->> 'activo' = 'true') AS canaleta_activa,
  count(*) FILTER (WHERE problemas -> 'techumbre' ->> 'activo' = 'true') AS techumbre_activa
FROM public.trabajos
WHERE problemas IS NOT NULL;

SELECT pg_get_constraintdef(oid) AS check_problema_tipo_tras_rollback
FROM pg_constraint
WHERE conrelid = 'public.trabajo_media'::regclass
  AND conname = 'trabajo_media_problema_tipo_check';
