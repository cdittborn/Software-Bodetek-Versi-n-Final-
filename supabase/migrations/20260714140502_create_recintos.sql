-- Recintos: locales / bodegas del centro comercial
create table public.recintos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  tipo text,
  superficie_m2 numeric(12, 2),
  plano_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.recintos is 'Locales y bodegas del centro comercial';

alter table public.recintos enable row level security;

create policy "Authenticated users can select recintos"
  on public.recintos for select
  to authenticated
  using (true);

create policy "Authenticated users can insert recintos"
  on public.recintos for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update recintos"
  on public.recintos for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete recintos"
  on public.recintos for delete
  to authenticated
  using (true);

grant select, insert, update, delete on table public.recintos to authenticated;
grant all on table public.recintos to service_role;
