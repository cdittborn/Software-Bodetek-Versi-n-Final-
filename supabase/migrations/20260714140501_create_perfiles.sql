-- Perfiles de usuario vinculados a auth.users
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  rol text not null
    check (rol in ('admin', 'pablo', 'asistente', 'socio', 'cliente')),
  nombre text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.perfiles is 'Perfil de cada usuario autenticado, con rol de acceso Bodetek';

alter table public.perfiles enable row level security;

create policy "Authenticated users can select perfiles"
  on public.perfiles for select
  to authenticated
  using (true);

create policy "Authenticated users can insert perfiles"
  on public.perfiles for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update perfiles"
  on public.perfiles for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete perfiles"
  on public.perfiles for delete
  to authenticated
  using (true);

grant select, insert, update, delete on table public.perfiles to authenticated;
grant all on table public.perfiles to service_role;
