-- Verificación post-migración de trabajos.problemas.
-- Compara descripcion/plan_accion (intactos) vs problemas[*].descripcion/plan.
-- El texto legado se considera conservado si aparece en CUALQUIER tipo
-- (techumbre por el backfill default, u otro si alguien ya reclasificó).
--
-- PASS cuando:
--   filas_texto_no_coincide = 0
--   con_texto_sin_json      = 0
--
--   npx supabase db query --db-url "$STAGING_SUPABASE_DB_URL" \
--     -f scripts/verificar-migracion-problemas.sql
--
-- Sin meta-comandos psql: compatible con `supabase db query -f`.

with filtraciones as (
  select
    id,
    codigo_filtracion,
    descripcion,
    plan_accion,
    problemas,
    coalesce(problemas -> 'techumbre' ->> 'descripcion', '') as d_techumbre,
    coalesce(problemas -> 'canaleta' ->> 'descripcion', '') as d_canaleta,
    coalesce(problemas -> 'cielo' ->> 'descripcion', '') as d_cielo,
    coalesce(problemas -> 'electrico' ->> 'descripcion', '') as d_electrico,
    coalesce(problemas -> 'techumbre' ->> 'plan', '') as p_techumbre,
    coalesce(problemas -> 'canaleta' ->> 'plan', '') as p_canaleta,
    coalesce(problemas -> 'cielo' ->> 'plan', '') as p_cielo,
    coalesce(problemas -> 'electrico' ->> 'plan', '') as p_electrico
  from public.trabajos
  where evento_id is not null
),
marcadas as (
  select
    f.*,
    coalesce(descripcion, '') as desc_legado,
    coalesce(plan_accion, '') as plan_legado,
    (
      coalesce(btrim(descripcion), '') <> ''
      or coalesce(btrim(plan_accion), '') <> ''
    ) as tiene_texto_legado,
    (
      coalesce(descripcion, '') <> ''
      and coalesce(descripcion, '') not in (d_techumbre, d_canaleta, d_cielo, d_electrico)
    ) as descripcion_perdida,
    (
      coalesce(plan_accion, '') <> ''
      and coalesce(plan_accion, '') not in (p_techumbre, p_canaleta, p_cielo, p_electrico)
    ) as plan_perdido
  from filtraciones f
),
conteos as (
  select
    count(*)::int as total_filtraciones,
    count(*) filter (where tiene_texto_legado)::int as con_texto_legado,
    count(*) filter (where problemas is not null)::int as con_json_problemas,
    count(*) filter (
      where problemas -> 'techumbre' ->> 'activo' = 'true'
    )::int as techumbre_activo_default,
    count(*) filter (
      where problemas -> 'canaleta' ->> 'activo' = 'true'
         or problemas -> 'cielo' ->> 'activo' = 'true'
         or problemas -> 'electrico' ->> 'activo' = 'true'
    )::int as otros_tipos_activos,
    count(*) filter (
      where problemas is not null
        and (descripcion_perdida or plan_perdido)
    )::int as filas_texto_no_coincide,
    count(*) filter (
      where problemas is null and tiene_texto_legado
    )::int as con_texto_sin_json
  from marcadas
)
select
  case
    when filas_texto_no_coincide = 0 and con_texto_sin_json = 0 then 'PASS'
    else 'FAIL'
  end as veredicto,
  total_filtraciones,
  con_texto_legado,
  con_json_problemas,
  techumbre_activo_default,
  otros_tipos_activos,
  filas_texto_no_coincide,
  con_texto_sin_json,
  'filas_texto_no_coincide=0 y con_texto_sin_json=0. Techumbre activo es DEFAULT, no clasificación real.' as nota
from conteos;
