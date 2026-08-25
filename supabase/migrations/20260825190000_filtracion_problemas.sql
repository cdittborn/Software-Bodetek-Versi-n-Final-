-- Filtración: columna jsonb `problemas` + backfill de texto legado.
--
-- CLASIFICACIÓN: no hay campo histórico (enum/`tipo`) en trabajos ni relacionadas.
--   * trabajo_categorias / trabajo_subtipos = módulo, no tipo de daño.
--   * trabajo_media.tipo = antes/despues/planos.
--   * recintos.tipo = local|bodega|…
--
-- Heurística sobre descripcion+plan_accion (substring, insensible a mayúsculas):
--   * "canaleta"  → Canaleta
--   * "cielo"     → Cielo
--   * "eléctric" o "electric" → Eléctrico
--   * ninguna     → Techumbre (FALLBACK para no perder texto, no dato real)
--   * dos o más   → AMBIGUO: se activan TODOS los tipos que matchearon (mismo
--     texto en cada bloque) y NO se elige un único tipo. Revisar a mano.
-- "techumbre" en el texto no es keyword; solo entra como fallback si no hay hits.
--
-- descripcion y plan_accion NO se modifican (scripts de verificación).
-- Idempotente: no pisa filas que ya tengan `problemas`.
-- Alcance: filtración-proyectos (evento_id is not null).

alter table public.trabajos
  add column if not exists problemas jsonb;

comment on column public.trabajos.problemas is
  'Bloques por tipo (techumbre|canaleta|cielo|electrico): {activo, descripcion, plan}. '
  'Backfill legado: keywords canaleta/cielo/eléctric|electric; 0 hits → techumbre fallback; '
  '2+ hits → todos los matcheados (ambiguo, reclasificar a mano).';

with clasificadas as (
  select
    t.id,
    coalesce(t.descripcion, '') as d,
    coalesce(t.plan_accion, '') as p,
    (coalesce(t.descripcion, '') || E'\n' || coalesce(t.plan_accion, '')) ~* 'canaleta' as hay_canaleta,
    (coalesce(t.descripcion, '') || E'\n' || coalesce(t.plan_accion, '')) ~* 'cielo' as hay_cielo,
    (
      (coalesce(t.descripcion, '') || E'\n' || coalesce(t.plan_accion, '')) ~* 'electric'
      or (coalesce(t.descripcion, '') || E'\n' || coalesce(t.plan_accion, '')) ~* 'eléctric'
    ) as hay_electrico
  from public.trabajos t
  where t.evento_id is not null
    and t.problemas is null
    and (
      coalesce(btrim(t.descripcion), '') <> ''
      or coalesce(btrim(t.plan_accion), '') <> ''
    )
)
update public.trabajos t
set problemas = jsonb_build_object(
  'techumbre', jsonb_build_object(
    'activo', not (c.hay_canaleta or c.hay_cielo or c.hay_electrico),
    'descripcion', case when not (c.hay_canaleta or c.hay_cielo or c.hay_electrico) then c.d else '' end,
    'plan', case when not (c.hay_canaleta or c.hay_cielo or c.hay_electrico) then c.p else '' end
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
