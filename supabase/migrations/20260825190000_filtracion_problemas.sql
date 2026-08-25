-- Tipos de problema (techumbre, canaleta, cielo, eléctrico) por filtración-proyecto.
-- Cada tipo guarda su propio bloque descripción + plan; desmarcar no borra el texto.

alter table public.trabajos
  add column if not exists problemas jsonb;

comment on column public.trabajos.problemas is
  'Bloques por tipo de problema (techumbre|canaleta|cielo|electrico): {activo, descripcion, plan}.';
