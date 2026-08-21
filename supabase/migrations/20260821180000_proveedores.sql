-- Proveedores: catálogo reutilizable + FK en trabajos / trabajo_media.
-- Renombra trabajos.proveedor → proveedor_texto_legado (historial).
-- No toca Patentes/Techos/Recintos/Auth/Otros trabajos CD salvo columnas compartidas.

-- ========== tabla proveedores ==========
create table if not exists public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre_empresa text not null,
  nombre_contacto text,
  celular text,
  email text,
  presente_antofagasta boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.proveedores is
  'Catálogo de proveedores externos (Filtración-Proyecto, cotizaciones, etc.).';

create index if not exists proveedores_nombre_empresa_idx
  on public.proveedores (nombre_empresa);

alter table public.proveedores enable row level security;

drop policy if exists "Roles can select proveedores" on public.proveedores;
drop policy if exists "Admin pablo asistente can insert proveedores" on public.proveedores;
drop policy if exists "Admin pablo asistente can update proveedores" on public.proveedores;
drop policy if exists "Admin pablo can delete proveedores" on public.proveedores;

create policy "Roles can select proveedores"
  on public.proveedores for select
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente'));

create policy "Admin pablo asistente can insert proveedores"
  on public.proveedores for insert
  to authenticated
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo asistente can update proveedores"
  on public.proveedores for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente'))
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo can delete proveedores"
  on public.proveedores for delete
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));

grant select, insert, update, delete on table public.proveedores to authenticated;
grant all on table public.proveedores to service_role;

-- ========== modulo proveedores ==========
alter table public.modulo_permisos
  drop constraint if exists modulo_permisos_modulo_check;

alter table public.modulo_permisos
  add constraint modulo_permisos_modulo_check
  check (
    modulo in (
      'rentas',
      'trabajos',
      'ggcc',
      'legal',
      'usuarios',
      'recintos',
      'proveedores'
    )
  );

insert into public.modulo_permisos (rol, modulo, puede_ver, puede_editar)
values
  ('admin', 'proveedores', true, true),
  ('pablo', 'proveedores', true, true),
  ('asistente', 'proveedores', true, true),
  ('socio', 'proveedores', true, false),
  ('cliente', 'proveedores', true, false)
on conflict (rol, modulo) do update
set
  puede_ver = excluded.puede_ver,
  puede_editar = excluded.puede_editar;

-- ========== trabajos: legado + FK ==========
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'trabajos'
      and column_name = 'proveedor'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'trabajos'
      and column_name = 'proveedor_texto_legado'
  ) then
    alter table public.trabajos rename column proveedor to proveedor_texto_legado;
  end if;
end $$;

comment on column public.trabajos.proveedor_texto_legado is
  'Texto libre histórico de proveedor (antes de catálogo). Solo lectura/legado.';

alter table public.trabajos
  add column if not exists proveedor_id uuid references public.proveedores (id) on delete set null;

comment on column public.trabajos.proveedor_id is
  'Proveedor del catálogo (Filtración-Proyecto). Nullable.';

create index if not exists trabajos_proveedor_id_idx
  on public.trabajos (proveedor_id);

-- ========== trabajo_media: FK proveedor (cotizaciones) ==========
alter table public.trabajo_media
  add column if not exists proveedor_id uuid references public.proveedores (id) on delete set null;

comment on column public.trabajo_media.proveedor_id is
  'Proveedor asociado al archivo (típicamente cotización). Nullable.';

create index if not exists trabajo_media_proveedor_id_idx
  on public.trabajo_media (proveedor_id);
