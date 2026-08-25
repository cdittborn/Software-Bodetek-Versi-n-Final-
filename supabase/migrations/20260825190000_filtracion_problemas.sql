-- Filtración: columna jsonb `problemas` + backfill de texto legado.
--
-- CLASIFICACIÓN: no hay dato histórico que permita inferir el tipo real
-- (techumbre | canaleta | cielo | electrico).
--
-- Revisión de schema (trabajos y relacionadas):
--   * trabajos: descripcion, plan_accion, titulo, gravedad, estado,
--     ejecutado_por, categoria_id, subtipo_id, evento_id, materiales,
--     prioridad. Ninguno es un enum/texto de tipo de problema de filtración.
--   * trabajo_categorias / trabajo_subtipos: módulo ("Techumbres y canales" /
--     "Lluvias y temporales"), no el tipo de daño de la ficha.
--   * trabajo_media.tipo: momento de evidencia (antes/despues/planos/…), no
--     el tipo de problema.
--   * recintos.tipo: local|bodega|estacionamiento|…, no aplica.
--
-- Tampoco se parsea descripcion/plan_accion por palabras clave
-- (techumbre/canaleta/cielo/eléctrico): el texto legado suele mezclar varios
-- tipos en el mismo párrafo (p. ej. seed Temporal 16 ago 2026: "Rotura en
-- techumbre + colapso de canaleta… cielos… circuitos eléctricos"). Un mapeo
-- automático sería una clasificación falsa.
--
-- Por eso el backfill copia descripcion/plan_accion al bloque `techumbre`
-- SOLO como valor por defecto para no perder texto. NO es un dato real.
-- Se espera que el usuario reclasifique manualmente las fichas migradas
-- (marcar Canaleta/Cielo/Eléctrico y desmarcar Techumbre cuando corresponda).
--
-- Alcance: solo filtración-proyectos (evento_id is not null).
-- descripcion y plan_accion NO se modifican, para poder comparar después
-- (scripts/verificar-migracion-problemas.sql).
-- Idempotente: no pisa filas que ya tengan `problemas`.

alter table public.trabajos
  add column if not exists problemas jsonb;

comment on column public.trabajos.problemas is
  'Bloques por tipo de problema (techumbre|canaleta|cielo|electrico): {activo, descripcion, plan}. '
  'El backfill legado usa techumbre como DEFAULT (no es clasificación real).';

update public.trabajos
set problemas = jsonb_build_object(
  'techumbre', jsonb_build_object(
    'activo', true,
    'descripcion', coalesce(descripcion, ''),
    'plan', coalesce(plan_accion, '')
  ),
  'canaleta', jsonb_build_object(
    'activo', false,
    'descripcion', '',
    'plan', ''
  ),
  'cielo', jsonb_build_object(
    'activo', false,
    'descripcion', '',
    'plan', ''
  ),
  'electrico', jsonb_build_object(
    'activo', false,
    'descripcion', '',
    'plan', ''
  )
)
where evento_id is not null
  and problemas is null
  and (
    coalesce(btrim(descripcion), '') <> ''
    or coalesce(btrim(plan_accion), '') <> ''
  );
