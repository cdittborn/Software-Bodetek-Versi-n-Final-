-- Muestra (hasta 15 filas) para inspección visual del backfill.
-- texto_ok = descripcion/plan_accion aparece en algún bloque de problemas.
--
--   npx supabase db query --db-url "$STAGING_SUPABASE_DB_URL" \
--     -f scripts/verificar-migracion-problemas-muestra.sql

select
  id,
  codigo_filtracion,
  left(coalesce(descripcion, ''), 80) as descripcion_antes,
  left(coalesce(problemas -> 'techumbre' ->> 'descripcion', ''), 80) as techumbre_despues,
  left(coalesce(plan_accion, ''), 80) as plan_antes,
  left(coalesce(problemas -> 'techumbre' ->> 'plan', ''), 80) as plan_despues,
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
order by codigo_filtracion
limit 15;
