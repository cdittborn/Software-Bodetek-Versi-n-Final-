-- Otros trabajos CD: subtipos nuevos + prioridad en tareas.
-- No toca RLS owner_id. Estado reutiliza trabajos.estado (pendiente|en_proceso|terminado).

-- ========== subtipos ==========
insert into public.trabajo_subtipos (categoria_id, nombre)
select c.id, s.nombre
from public.trabajo_categorias as c
cross join (
  values
    ('Otros'),
    ('Administración de propiedades')
) as s (nombre)
where c.nombre = 'Otros trabajos CD'
on conflict (categoria_id, nombre) do nothing;

-- ========== prioridad ==========
alter table public.trabajos
  add column if not exists prioridad text;

alter table public.trabajos
  drop constraint if exists trabajos_prioridad_check;

alter table public.trabajos
  add constraint trabajos_prioridad_check
  check (prioridad is null or prioridad in ('alta', 'media', 'baja'));

comment on column public.trabajos.prioridad is
  'Prioridad de tarea (Otros trabajos CD): alta|media|baja. Nullable en otros módulos.';

-- Backfill tareas de la categoría privada que aún usan defaults viejos
update public.trabajos as t
set
  estado = case when t.estado = 'planificado' then 'pendiente' else t.estado end,
  prioridad = coalesce(t.prioridad, 'media')
from public.trabajo_categorias as c
where t.categoria_id = c.id
  and c.nombre = 'Otros trabajos CD'
  and (t.estado = 'planificado' or t.prioridad is null);
