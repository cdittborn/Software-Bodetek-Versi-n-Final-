-- Quitar tipo Canaleta: absorber en Techumbre y ajustar check de problema_tipo.
-- NO aplicar en producción sin dry-run + confirmación explícita + COMMIT.

UPDATE public.trabajo_media
SET problema_tipo = 'techumbre'
WHERE problema_tipo = 'canaleta';

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
