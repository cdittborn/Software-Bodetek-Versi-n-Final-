-- Trabajos: proyectos de control y seguimiento
create table public.trabajos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.trabajo_categorias (id),
  subtipo_id uuid references public.trabajo_subtipos (id),
  recinto_id uuid references public.recintos (id),
  titulo text not null,
  descripcion text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'en_progreso', 'completado', 'cancelado')),
  responsable uuid references public.perfiles (id),
  fecha_inicio date,
  fecha_termino date,
  periodicidad_dias integer check (periodicidad_dias is null or periodicidad_dias > 0),
  proxima_mantencion date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.trabajos is 'Proyectos de trabajo del Módulo 2 (control y seguimiento)';

create index trabajos_categoria_id_idx on public.trabajos (categoria_id);
create index trabajos_recinto_id_idx on public.trabajos (recinto_id);
create index trabajos_estado_idx on public.trabajos (estado);
create index trabajos_proxima_mantencion_idx on public.trabajos (proxima_mantencion);

alter table public.trabajos enable row level security;

create policy "Authenticated users can select trabajos"
  on public.trabajos for select
  to authenticated
  using (true);

create policy "Authenticated users can insert trabajos"
  on public.trabajos for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update trabajos"
  on public.trabajos for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete trabajos"
  on public.trabajos for delete
  to authenticated
  using (true);

grant select, insert, update, delete on table public.trabajos to authenticated;
grant all on table public.trabajos to service_role;
