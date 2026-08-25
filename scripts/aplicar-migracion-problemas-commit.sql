-- Aplicación REAL en producción. UNA sesión: BEGIN → migración → COMMIT.
-- No usar este archivo salvo OK explícito. El dry-run está en
-- scripts/dry-run-migracion-problemas-rollback.sql

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- === supabase/migrations/20260825190000_filtracion_problemas.sql ===

alter table public.trabajos
  add column if not exists problemas jsonb;

comment on column public.trabajos.problemas is
  'Bloques por tipo (techumbre|canaleta|cielo|electrico): {activo, descripcion, plan}. '
  'Backfill: keywords techumbre/canaleta/cielo/eléctric|electric '
  '(se ignora "cielo americano"); 0 hits → techumbre fallback; 2+ → ambiguo.';

with base as (
  select
    t.id,
    coalesce(t.descripcion, '') as d,
    coalesce(t.plan_accion, '') as p,
    regexp_replace(
      coalesce(t.descripcion, '') || E'\n' || coalesce(t.plan_accion, ''),
      'cielos?\s+americanos?',
      ' ',
      'gi'
    ) as blob
  from public.trabajos t
  where t.evento_id is not null
    and t.problemas is null
    and (
      coalesce(btrim(t.descripcion), '') <> ''
      or coalesce(btrim(t.plan_accion), '') <> ''
    )
),
clasificadas as (
  select
    id,
    d,
    p,
    blob ~* 'techumbre' as hay_techumbre,
    blob ~* 'canaleta' as hay_canaleta,
    blob ~* 'cielo' as hay_cielo,
    (blob ~* 'electric' or blob ~* 'eléctric') as hay_electrico
  from base
)
update public.trabajos t
set problemas = jsonb_build_object(
  'techumbre', jsonb_build_object(
    'activo', c.hay_techumbre or not (c.hay_techumbre or c.hay_canaleta or c.hay_cielo or c.hay_electrico),
    'descripcion', case
      when c.hay_techumbre or not (c.hay_techumbre or c.hay_canaleta or c.hay_cielo or c.hay_electrico)
      then c.d else '' end,
    'plan', case
      when c.hay_techumbre or not (c.hay_techumbre or c.hay_canaleta or c.hay_cielo or c.hay_electrico)
      then c.p else '' end
  ),
  'canaleta', jsonb_build_object(
    'activo', c.hay_canaleta,
    'descripcion', case when c.hay_canaleta then c.d else '' end,
    'plan', case when c.hay_canaleta then c.p else '' end
  ),
  'cielo', jsonb_build_object(
    'activo', c.hay_cielo,
    'descripcion', case when c.hay_cielo then c.d else '' end,
    'plan', case when c.hay_cielo then c.p else '' end
  ),
  'electrico', jsonb_build_object(
    'activo', c.hay_electrico,
    'descripcion', case when c.hay_electrico then c.d else '' end,
    'plan', case when c.hay_electrico then c.p else '' end
  )
)
from clasificadas c
where t.id = c.id;

COMMIT;
