-- Categorías y subtipos de trabajos
create table public.trabajo_categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  created_at timestamptz not null default now()
);

create table public.trabajo_subtipos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.trabajo_categorias (id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now(),
  unique (categoria_id, nombre)
);

comment on table public.trabajo_categorias is 'Categorías: Imagen, Seguridad, Protocolos, Otros';
comment on table public.trabajo_subtipos is 'Subtipos por categoría (ej. Imagen: Pórtico, Letreros, Fachadas)';

alter table public.trabajo_categorias enable row level security;
alter table public.trabajo_subtipos enable row level security;

create policy "Authenticated users can select trabajo_categorias"
  on public.trabajo_categorias for select
  to authenticated
  using (true);

create policy "Authenticated users can insert trabajo_categorias"
  on public.trabajo_categorias for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update trabajo_categorias"
  on public.trabajo_categorias for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete trabajo_categorias"
  on public.trabajo_categorias for delete
  to authenticated
  using (true);

create policy "Authenticated users can select trabajo_subtipos"
  on public.trabajo_subtipos for select
  to authenticated
  using (true);

create policy "Authenticated users can insert trabajo_subtipos"
  on public.trabajo_subtipos for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update trabajo_subtipos"
  on public.trabajo_subtipos for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete trabajo_subtipos"
  on public.trabajo_subtipos for delete
  to authenticated
  using (true);

grant select, insert, update, delete on table public.trabajo_categorias to authenticated;
grant all on table public.trabajo_categorias to service_role;
grant select, insert, update, delete on table public.trabajo_subtipos to authenticated;
grant all on table public.trabajo_subtipos to service_role;
