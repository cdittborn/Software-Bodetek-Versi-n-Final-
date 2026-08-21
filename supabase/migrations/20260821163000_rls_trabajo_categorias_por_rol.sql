-- RLS trabajo_categorias: públicas por rol; privadas (owner_id) sin cambio de dueño.
-- SELECT: roles del módulo. INSERT/UPDATE: admin/pablo/asistente. DELETE: admin/pablo.
-- Privadas: solo owner_id = auth.uid().

drop policy if exists "Select trabajo_categorias publicas o propias"
  on public.trabajo_categorias;
drop policy if exists "Insert trabajo_categorias publicas o propias"
  on public.trabajo_categorias;
drop policy if exists "Update trabajo_categorias publicas o propias"
  on public.trabajo_categorias;
drop policy if exists "Delete trabajo_categorias publicas o propias"
  on public.trabajo_categorias;

create policy "Select trabajo_categorias publicas o propias"
  on public.trabajo_categorias for select
  to authenticated
  using (
    (
      owner_id is null
      and public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente')
    )
    or owner_id = auth.uid()
  );

create policy "Insert trabajo_categorias publicas o propias"
  on public.trabajo_categorias for insert
  to authenticated
  with check (
    (
      owner_id is null
      and public.mi_rol() in ('admin', 'pablo', 'asistente')
    )
    or owner_id = auth.uid()
  );

create policy "Update trabajo_categorias publicas o propias"
  on public.trabajo_categorias for update
  to authenticated
  using (
    (
      owner_id is null
      and public.mi_rol() in ('admin', 'pablo', 'asistente')
    )
    or owner_id = auth.uid()
  )
  with check (
    (
      owner_id is null
      and public.mi_rol() in ('admin', 'pablo', 'asistente')
    )
    or owner_id = auth.uid()
  );

create policy "Delete trabajo_categorias publicas o propias"
  on public.trabajo_categorias for delete
  to authenticated
  using (
    (
      owner_id is null
      and public.mi_rol() in ('admin', 'pablo')
    )
    or owner_id = auth.uid()
  );
