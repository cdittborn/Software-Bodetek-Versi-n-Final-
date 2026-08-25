-- Filtración: columna jsonb `problemas` + backfill de texto legado.
--
-- CLASIFICACIÓN: no hay campo histórico (enum/`tipo`) en trabajos ni relacionadas.
--
-- Heurística sobre descripcion+plan_accion (substring, insensible a mayúsculas).
-- Antes de buscar "cielo", se ignora el término de material "cielo(s) americano(s)".
--   * "techumbre" → Techumbre (confirmado por texto)
--   * "canaleta"  → Canaleta
--   * "cielo"     → Cielo (no si solo era cielo americano)
--   * "eléctric" o "electric" → Eléctrico
--   * ninguna     → Techumbre FALLBACK (no es dato real; reclasificar)
--   * dos o más   → AMBIGUO: se activan TODOS los tipos matcheados.
--
-- descripcion y plan_accion NO se modifican.
-- Idempotente: no pisa filas que ya tengan `problemas`.
-- Alcance: filtración-proyectos (evento_id is not null).

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
