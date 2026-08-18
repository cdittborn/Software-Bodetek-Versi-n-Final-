-- Refina RLS de tablas del Módulo 2 según rol en perfiles.
-- admin/pablo: CRUD completo
-- asistente: select, insert, update (sin delete)
-- socio/cliente: solo select

create or replace function public.mi_rol()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.perfiles where id = auth.uid();
$$;

revoke all on function public.mi_rol() from public;
grant execute on function public.mi_rol() to authenticated;

-- ========== trabajos ==========
drop policy if exists "Authenticated users can select trabajos" on public.trabajos;
drop policy if exists "Authenticated users can insert trabajos" on public.trabajos;
drop policy if exists "Authenticated users can update trabajos" on public.trabajos;
drop policy if exists "Authenticated users can delete trabajos" on public.trabajos;

create policy "Roles can select trabajos"
  on public.trabajos for select
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente'));

create policy "Admin pablo asistente can insert trabajos"
  on public.trabajos for insert
  to authenticated
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo asistente can update trabajos"
  on public.trabajos for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente'))
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo can delete trabajos"
  on public.trabajos for delete
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));

-- ========== trabajo_fotos ==========
drop policy if exists "Authenticated users can select trabajo_fotos" on public.trabajo_fotos;
drop policy if exists "Authenticated users can insert trabajo_fotos" on public.trabajo_fotos;
drop policy if exists "Authenticated users can update trabajo_fotos" on public.trabajo_fotos;
drop policy if exists "Authenticated users can delete trabajo_fotos" on public.trabajo_fotos;

create policy "Roles can select trabajo_fotos"
  on public.trabajo_fotos for select
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente'));

create policy "Admin pablo asistente can insert trabajo_fotos"
  on public.trabajo_fotos for insert
  to authenticated
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo asistente can update trabajo_fotos"
  on public.trabajo_fotos for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente'))
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo can delete trabajo_fotos"
  on public.trabajo_fotos for delete
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));

-- ========== protocolos ==========
drop policy if exists "Authenticated users can select protocolos" on public.protocolos;
drop policy if exists "Authenticated users can insert protocolos" on public.protocolos;
drop policy if exists "Authenticated users can update protocolos" on public.protocolos;
drop policy if exists "Authenticated users can delete protocolos" on public.protocolos;

create policy "Roles can select protocolos"
  on public.protocolos for select
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente'));

create policy "Admin pablo asistente can insert protocolos"
  on public.protocolos for insert
  to authenticated
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo asistente can update protocolos"
  on public.protocolos for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente'))
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo can delete protocolos"
  on public.protocolos for delete
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));

-- ========== recintos ==========
drop policy if exists "Authenticated users can select recintos" on public.recintos;
drop policy if exists "Authenticated users can insert recintos" on public.recintos;
drop policy if exists "Authenticated users can update recintos" on public.recintos;
drop policy if exists "Authenticated users can delete recintos" on public.recintos;

create policy "Roles can select recintos"
  on public.recintos for select
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente'));

create policy "Admin pablo asistente can insert recintos"
  on public.recintos for insert
  to authenticated
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo asistente can update recintos"
  on public.recintos for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente'))
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo can delete recintos"
  on public.recintos for delete
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));
