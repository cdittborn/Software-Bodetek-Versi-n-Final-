-- Fotos de trabajos (antes/después) y protocolos documentales
create table public.trabajo_fotos (
  id uuid primary key default gen_random_uuid(),
  trabajo_id uuid not null references public.trabajos (id) on delete cascade,
  tipo text not null check (tipo in ('antes', 'despues')),
  url text not null,
  created_at timestamptz not null default now()
);

create table public.protocolos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text check (tipo in ('reglamento', 'emergencia', 'otro')),
  documento_url text,
  estado text not null default 'vigente'
    check (estado in ('vigente', 'vencido')),
  fecha_vigencia date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.trabajo_fotos is 'Fotos antes/después asociadas a un trabajo';
comment on table public.protocolos is 'Documentos de reglamento/emergencia con vigencia';

create index trabajo_fotos_trabajo_id_idx on public.trabajo_fotos (trabajo_id);

alter table public.trabajo_fotos enable row level security;
alter table public.protocolos enable row level security;

create policy "Authenticated users can select trabajo_fotos"
  on public.trabajo_fotos for select
  to authenticated
  using (true);

create policy "Authenticated users can insert trabajo_fotos"
  on public.trabajo_fotos for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update trabajo_fotos"
  on public.trabajo_fotos for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete trabajo_fotos"
  on public.trabajo_fotos for delete
  to authenticated
  using (true);

create policy "Authenticated users can select protocolos"
  on public.protocolos for select
  to authenticated
  using (true);

create policy "Authenticated users can insert protocolos"
  on public.protocolos for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update protocolos"
  on public.protocolos for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete protocolos"
  on public.protocolos for delete
  to authenticated
  using (true);

grant select, insert, update, delete on table public.trabajo_fotos to authenticated;
grant all on table public.trabajo_fotos to service_role;
grant select, insert, update, delete on table public.protocolos to authenticated;
grant all on table public.protocolos to service_role;
