-- Permisos de módulos por rol
create table public.modulo_permisos (
  id uuid primary key default gen_random_uuid(),
  rol text not null
    check (rol in ('admin', 'pablo', 'asistente', 'socio', 'cliente')),
  modulo text not null
    check (modulo in ('rentas', 'trabajos', 'ggcc', 'legal', 'usuarios')),
  puede_ver boolean not null default true,
  puede_editar boolean not null default false,
  unique (rol, modulo)
);

comment on table public.modulo_permisos is 'Permisos de acceso a módulos de Bodetek por rol';

alter table public.modulo_permisos enable row level security;

-- Lectura: cualquier usuario autenticado (para saber qué puede ver)
create policy "Authenticated users can select modulo_permisos"
  on public.modulo_permisos for select
  to authenticated
  using (true);

-- Escritura: solo admin y pablo (según perfiles)
create policy "Admin and pablo can insert modulo_permisos"
  on public.modulo_permisos for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.perfiles
      where perfiles.id = auth.uid()
        and perfiles.rol in ('admin', 'pablo')
    )
  );

create policy "Admin and pablo can update modulo_permisos"
  on public.modulo_permisos for update
  to authenticated
  using (
    exists (
      select 1
      from public.perfiles
      where perfiles.id = auth.uid()
        and perfiles.rol in ('admin', 'pablo')
    )
  )
  with check (
    exists (
      select 1
      from public.perfiles
      where perfiles.id = auth.uid()
        and perfiles.rol in ('admin', 'pablo')
    )
  );

create policy "Admin and pablo can delete modulo_permisos"
  on public.modulo_permisos for delete
  to authenticated
  using (
    exists (
      select 1
      from public.perfiles
      where perfiles.id = auth.uid()
        and perfiles.rol in ('admin', 'pablo')
    )
  );

grant select on table public.modulo_permisos to authenticated;
grant insert, update, delete on table public.modulo_permisos to authenticated;
grant all on table public.modulo_permisos to service_role;
