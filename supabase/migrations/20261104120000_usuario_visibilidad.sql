-- Fase 2b: qué categorías ve cada persona.
-- Solo aditiva: una columna, una tabla, funciones, triggers y políticas
-- de lectura AS RESTRICTIVE. No borra filas, no toca las políticas que ya
-- deciden el rol, y no cambia quién puede editar.
--
-- Requiere la migración del menú (columnas clave y archivada).
--
-- Cómo se lee:
--   perfiles.visibilidad_personalizada = false  →  esa persona ve todo
--     (es el valor de todos hoy, y el de un usuario nuevo).
--   = true  →  solo ve las filas de usuario_visibilidad.
--   Un admin ve todo aunque la marca esté en true: no se le puede restringir.
-- Una fila de usuario_visibilidad es un permiso, no una prohibición:
--   subtipo_id null = categoría sin subcategorías.
--   subtipo_id lleno = esa subcategoría.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'trabajo_categorias'
      and column_name = 'archivada'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'trabajo_subtipos'
      and column_name = 'clave'
  ) then
    raise exception 'Falta la migración del menú (columnas archivada y clave).';
  end if;
end $$;

-- 1. La marca "todavía ve todo" ----------------------------------------------

alter table public.perfiles
  add column visibilidad_personalizada boolean not null default false;

comment on column public.perfiles.visibilidad_personalizada is
  'False: ve todas las categorías, como el día en que se creó esta función. True: solo ve las filas de usuario_visibilidad. Un admin ve todo igual.';

-- Nadie, salvo un admin, puede prender o apagar esa marca por su cuenta.
-- Si no, cualquiera se la pondría en false y volvería a verlo todo.
create function public.perfiles_bloquear_visibilidad()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.visibilidad_personalizada is not distinct from old.visibilidad_personalizada then
    return new;
  end if;
  if public.mi_rol() is distinct from 'admin' then
    raise exception 'Solo un administrador puede cambiar lo que ve cada persona.'
      using errcode = '42501';
  end if;
  if new.rol = 'admin' and new.visibilidad_personalizada then
    raise exception 'Un administrador ve todas las categorías siempre.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger perfiles_bloquear_visibilidad
  before update on public.perfiles
  for each row
  execute function public.perfiles_bloquear_visibilidad();

revoke all on function public.perfiles_bloquear_visibilidad() from public, anon;
grant execute on function public.perfiles_bloquear_visibilidad() to authenticated;

-- 2. Qué tiene marcado cada persona ------------------------------------------

create table public.usuario_visibilidad (
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  categoria_id uuid not null references public.trabajo_categorias (id) on delete cascade,
  subtipo_id uuid references public.trabajo_subtipos (id) on delete cascade
);

create unique index usuario_visibilidad_unica
  on public.usuario_visibilidad (usuario_id, categoria_id, subtipo_id) nulls not distinct;

create index usuario_visibilidad_usuario_idx
  on public.usuario_visibilidad (usuario_id);

comment on table public.usuario_visibilidad is
  'Subcategorías (o categorías sin hijas) que una persona puede ver. Solo se usa si su perfil tiene visibilidad_personalizada. Vacía y con la marca en false = ve todo.';

create function public.usuario_visibilidad_solo_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario uuid;
  v_categoria uuid;
  v_subtipo uuid;
begin
  if public.mi_rol() is distinct from 'admin' then
    raise exception 'Solo un administrador puede cambiar lo que ve cada persona.'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  v_usuario := new.usuario_id;
  v_categoria := new.categoria_id;
  v_subtipo := new.subtipo_id;

  if exists (select 1 from public.perfiles p where p.id = v_usuario and p.rol = 'admin') then
    raise exception 'Un administrador ve todas las categorías siempre.'
      using errcode = '42501';
  end if;

  if exists (
    select 1 from public.trabajo_categorias c
    where c.id = v_categoria and c.archivada
  ) then
    raise exception 'No se configura una categoría archivada.'
      using errcode = '42501';
  end if;

  if v_subtipo is null then
    if exists (select 1 from public.trabajo_subtipos s where s.categoria_id = v_categoria) then
      raise exception 'Esa categoría se marca por subcategoría.'
        using errcode = '42501';
    end if;
  elsif not exists (
    select 1 from public.trabajo_subtipos s
    where s.id = v_subtipo and s.categoria_id = v_categoria
  ) then
    raise exception 'La subcategoría no pertenece a esa categoría.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger usuario_visibilidad_solo_admin
  before insert or update or delete on public.usuario_visibilidad
  for each row
  execute function public.usuario_visibilidad_solo_admin();

revoke all on function public.usuario_visibilidad_solo_admin() from public, anon;
grant execute on function public.usuario_visibilidad_solo_admin() to authenticated;

alter table public.usuario_visibilidad enable row level security;

create policy "Cada uno lee su visibilidad"
  on public.usuario_visibilidad
  for select
  to authenticated
  using (usuario_id = auth.uid() or public.mi_rol() = 'admin');

revoke all on table public.usuario_visibilidad from public, anon, authenticated;
grant select on table public.usuario_visibilidad to authenticated;

-- 3. La pregunta que hacen las políticas de lectura ---------------------------
-- Son security definer y apagan row_security para no entrar en un círculo
-- con las políticas de las tablas que están mirando.

create function public.ve_categoria_o_subtipo(p_categoria_id uuid, p_subtipo_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    p_categoria_id is null
    or public.mi_rol() = 'admin'
    or public.soy_dueno_categoria(p_categoria_id)
    or coalesce(
      (
        select not p.visibilidad_personalizada
        from public.perfiles p
        where p.id = auth.uid()
      ),
      true
    )
    or exists (
      select 1
      from public.usuario_visibilidad v
      where v.usuario_id = auth.uid()
        and v.categoria_id = p_categoria_id
        and v.subtipo_id is not distinct from p_subtipo_id
    );
$$;

create function public.ve_evento(p_evento_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.ve_categoria_o_subtipo(s.categoria_id, e.subtipo_id)
  from public.eventos e
  join public.trabajo_subtipos s on s.id = e.subtipo_id
  where e.id = p_evento_id;
$$;

create function public.ve_trabajo(p_trabajo_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.ve_categoria_o_subtipo(t.categoria_id, t.subtipo_id)
  from public.trabajos t
  where t.id = p_trabajo_id;
$$;

-- El cajón de fotos sin trabajo es de Lluvias. Si la persona ve todo,
-- sigue igual que hoy. Si ya se le restringió, lo ve solo si ve Lluvias.
create function public.ve_media_sin_trabajo()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select case
    when public.mi_rol() = 'admin' then true
    when coalesce(
      (
        select not p.visibilidad_personalizada
        from public.perfiles p
        where p.id = auth.uid()
      ),
      true
    ) then true
    else exists (
      select 1
      from public.trabajo_subtipos s
      where s.clave = 'lluvias_temporales'
        and public.ve_categoria_o_subtipo(s.categoria_id, s.id)
    )
  end;
$$;

create function public.ve_fachadas()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select case
    when public.mi_rol() = 'admin' then true
    when not exists (
      select 1 from public.trabajo_subtipos where clave = 'fachadas'
    ) then coalesce(
      (
        select not p.visibilidad_personalizada
        from public.perfiles p
        where p.id = auth.uid()
      ),
      true
    )
    else exists (
      select 1
      from public.trabajo_subtipos s
      where s.clave = 'fachadas'
        and public.ve_categoria_o_subtipo(s.categoria_id, s.id)
    )
  end;
$$;

create function public.ve_compra(p_compra_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.ve_evento(c.evento_id)
  from public.compras_materiales c
  where c.id = p_compra_id;
$$;

create function public.ve_informe(p_informe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.ve_evento(i.evento_id)
  from public.informes_seguro i
  where i.id = p_informe_id;
$$;

revoke all on function public.ve_categoria_o_subtipo(uuid, uuid) from public, anon;
revoke all on function public.ve_evento(uuid) from public, anon;
revoke all on function public.ve_trabajo(uuid) from public, anon;
revoke all on function public.ve_media_sin_trabajo() from public, anon;
revoke all on function public.ve_fachadas() from public, anon;
revoke all on function public.ve_compra(uuid) from public, anon;
revoke all on function public.ve_informe(uuid) from public, anon;

grant execute on function public.ve_categoria_o_subtipo(uuid, uuid) to authenticated;
grant execute on function public.ve_evento(uuid) to authenticated;
grant execute on function public.ve_trabajo(uuid) to authenticated;
grant execute on function public.ve_media_sin_trabajo() to authenticated;
grant execute on function public.ve_fachadas() to authenticated;
grant execute on function public.ve_compra(uuid) to authenticated;
grant execute on function public.ve_informe(uuid) to authenticated;

-- 4. Políticas de lectura, sumadas a las del rol ----------------------------
-- AS RESTRICTIVE se combina con AND. Si la función responde true, la persona
-- ve exactamente lo que ya veía. No reemplazan las políticas de editar.

create policy "Visibilidad trabajos"
  on public.trabajos
  as restrictive
  for select
  to authenticated
  using (public.ve_categoria_o_subtipo(categoria_id, subtipo_id));

create policy "Visibilidad eventos"
  on public.eventos
  as restrictive
  for select
  to authenticated
  using (public.ve_evento(id));

create policy "Visibilidad trabajo_media"
  on public.trabajo_media
  as restrictive
  for select
  to authenticated
  using (
    (trabajo_id is not null and public.ve_trabajo(trabajo_id))
    or (trabajo_id is null and public.ve_media_sin_trabajo())
  );

create policy "Visibilidad compras_materiales"
  on public.compras_materiales
  as restrictive
  for select
  to authenticated
  using (public.ve_evento(evento_id));

create policy "Visibilidad compra_material_trabajos"
  on public.compra_material_trabajos
  as restrictive
  for select
  to authenticated
  using (public.ve_compra(compra_id));

do $$
declare
  t text;
begin
  foreach t in array array[
    'fachadas',
    'fachada_intervenciones',
    'fachada_intervencion_tipos',
    'fachada_cotizaciones',
    'fachada_cotizacion_tipos',
    'fachada_hojalateria',
    'fachada_materiales',
    'fachada_media',
    'fachada_documentos',
    'fachada_archivos',
    'fachada_recintos',
    'fachadas_reportes',
    'fachadas_reporte_versiones'
  ]
  loop
    execute format(
      'create policy "Visibilidad fachadas" on public.%I as restrictive for select to authenticated using (public.ve_fachadas())',
      t
    );
  end loop;
end $$;

create policy "Visibilidad informes_seguro"
  on public.informes_seguro
  as restrictive
  for select
  to authenticated
  using (public.ve_evento(evento_id));

create policy "Visibilidad informe_seguro_recintos"
  on public.informe_seguro_recintos
  as restrictive
  for select
  to authenticated
  using (public.ve_informe(informe_id));

create policy "Visibilidad informe_seguro_subproyectos"
  on public.informe_seguro_subproyectos
  as restrictive
  for select
  to authenticated
  using (public.ve_informe(informe_id));

create policy "Visibilidad informe_seguro_media"
  on public.informe_seguro_media
  as restrictive
  for select
  to authenticated
  using (public.ve_informe(informe_id));

create policy "Visibilidad informe_seguro_versiones"
  on public.informe_seguro_versiones
  as restrictive
  for select
  to authenticated
  using (public.ve_informe(informe_id));

-- 5. Guardar desde la pantalla, en un solo paso ------------------------------
-- p_todo true: vuelve a ver todo (borra sus filas y apaga la marca).
-- p_todo false: deja solo p_items. Un arreglo vacío es "Ninguna".

create function public.guardar_visibilidad_usuario(
  p_usuario uuid,
  p_todo boolean,
  p_items jsonb
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_rol text;
begin
  if public.mi_rol() is distinct from 'admin' then
    raise exception 'Solo un administrador puede cambiar lo que ve cada persona.'
      using errcode = '42501';
  end if;

  select rol into v_rol from public.perfiles where id = p_usuario;
  if v_rol is null then
    raise exception 'Esa persona no existe.';
  end if;
  if v_rol = 'admin' then
    raise exception 'Un administrador ve todas las categorías siempre.'
      using errcode = '42501';
  end if;

  if p_todo then
    delete from public.usuario_visibilidad where usuario_id = p_usuario;
    update public.perfiles
    set visibilidad_personalizada = false
    where id = p_usuario;
    return;
  end if;

  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) is distinct from 'array' then
    raise exception 'Formato inválido: falta la lista de categorías.';
  end if;

  delete from public.usuario_visibilidad where usuario_id = p_usuario;

  insert into public.usuario_visibilidad (usuario_id, categoria_id, subtipo_id)
  select distinct p_usuario, x.categoria_id, x.subtipo_id
  from jsonb_to_recordset(p_items) as x(categoria_id uuid, subtipo_id uuid);

  update public.perfiles
  set visibilidad_personalizada = true
  where id = p_usuario;
end;
$$;

revoke all on function public.guardar_visibilidad_usuario(uuid, boolean, jsonb) from public, anon;
grant execute on function public.guardar_visibilidad_usuario(uuid, boolean, jsonb) to authenticated;
