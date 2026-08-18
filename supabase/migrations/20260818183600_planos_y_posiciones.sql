-- Plano general del complejo + posiciones de etiquetas (x/y en % de la imagen).

create table public.planos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  sitio text,
  imagen_key text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.planos is
  'Imágenes de plano (general o por sitio). imagen_key es la key R2, prefijo planos/.';
comment on column public.planos.sitio is
  'Sitio al que aplica el plano (1, 2, …). null = complejo entero.';
comment on column public.planos.imagen_key is
  'Key del objeto en R2, no URL completa.';

create unique index planos_solo_uno_activo
  on public.planos (activo)
  where activo = true;

create table public.recinto_posiciones_plano (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references public.planos (id) on delete cascade,
  recinto_id uuid not null references public.recintos (id) on delete cascade,
  x_pct numeric(6, 3) not null check (x_pct >= 0 and x_pct <= 100),
  y_pct numeric(6, 3) not null check (y_pct >= 0 and y_pct <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plano_id, recinto_id)
);

comment on table public.recinto_posiciones_plano is
  'Anclaje de cada recinto sobre un plano. x_pct/y_pct son % del ancho/alto; origen arriba-izquierda; ancla = centro de la etiqueta.';

alter table public.planos enable row level security;
alter table public.recinto_posiciones_plano enable row level security;

create policy "Admin pablo asistente can select planos"
  on public.planos for select
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo can insert planos"
  on public.planos for insert
  to authenticated
  with check (public.mi_rol() in ('admin', 'pablo'));

create policy "Admin pablo can update planos"
  on public.planos for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'))
  with check (public.mi_rol() in ('admin', 'pablo'));

create policy "Admin pablo can delete planos"
  on public.planos for delete
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));

create policy "Admin pablo asistente can select recinto_posiciones_plano"
  on public.recinto_posiciones_plano for select
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo can insert recinto_posiciones_plano"
  on public.recinto_posiciones_plano for insert
  to authenticated
  with check (public.mi_rol() in ('admin', 'pablo'));

create policy "Admin pablo can update recinto_posiciones_plano"
  on public.recinto_posiciones_plano for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'))
  with check (public.mi_rol() in ('admin', 'pablo'));

create policy "Admin pablo can delete recinto_posiciones_plano"
  on public.recinto_posiciones_plano for delete
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));

grant select, insert, update, delete on table public.planos to authenticated;
grant all on table public.planos to service_role;
grant select, insert, update, delete on table public.recinto_posiciones_plano to authenticated;
grant all on table public.recinto_posiciones_plano to service_role;
