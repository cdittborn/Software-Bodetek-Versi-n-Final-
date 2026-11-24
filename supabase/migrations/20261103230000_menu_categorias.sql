-- Rediseño fase 2: editar categorías del menú y archivar "Otros trabajos CD".
-- Solo aditiva: agrega columnas, índices, funciones, triggers y políticas.
-- No borra filas, no borra ni renombra columnas, no cambia tipos y no toca
-- las políticas existentes (las nuevas son AS RESTRICTIVE).

-- 1. Columnas nuevas ---------------------------------------------------------

alter table public.trabajo_categorias
  add column orden integer,
  add column color text,
  add column clave text,
  add column protegida boolean not null default false,
  add column archivada boolean not null default false;

alter table public.trabajo_categorias
  add constraint trabajo_categorias_color_paleta check (
    color is null
    or color in ('#5E87D6', '#9682CF', '#4E9E92', '#C9973F', '#C7707D', '#8A90A0', '#5E9E70')
  );

alter table public.trabajo_subtipos
  add column orden integer,
  add column clave text,
  add column protegida boolean not null default false;

create unique index trabajo_categorias_clave_key
  on public.trabajo_categorias (clave) where clave is not null;
create unique index trabajo_subtipos_clave_key
  on public.trabajo_subtipos (clave) where clave is not null;

-- 2. Relleno de las columnas nuevas (solo esas columnas) -----------------------

-- Orden y color iguales a lo que muestra hoy el menú: Techumbres primero,
-- el resto por nombre, "Otros" y "Otros trabajos CD" al final.
with ordenadas as (
  select id,
    row_number() over (
      order by
        case
          when nombre = 'Techumbres y canales' then 0
          when nombre in ('Otros', 'Otros trabajos CD') then 2
          else 1
        end,
        nombre
    ) as n
  from public.trabajo_categorias
)
update public.trabajo_categorias c
set orden = o.n,
  color = (array['#5E87D6', '#9682CF', '#4E9E92', '#C9973F', '#C7707D', '#8A90A0', '#5E9E70'])[((o.n - 1) % 7) + 1]
from ordenadas o
where o.id = c.id;

with ordenados as (
  select id, row_number() over (partition by categoria_id order by nombre) as n
  from public.trabajo_subtipos
)
update public.trabajo_subtipos s
set orden = o.n
from ordenados o
where o.id = s.id;

-- Claves estables y protección. Cada fila se busca por id y por nombre; si
-- alguna no calza, la migración entera se cancela.
do $$
declare
  r record;
  n integer;
begin
  for r in
    select * from (values
      ('8fc81213-50bb-4403-ae8c-f6a2902059c4'::uuid, 'Techumbres y canales', 'techumbres', true, false),
      ('6610bbfd-cdbf-4090-a5ec-8679e76795da'::uuid, 'Imagen', 'imagen', true, false),
      ('08b48e08-152d-491f-b6a0-a566dc040d05'::uuid, 'Patentes', 'patentes', true, false),
      ('c0b45b99-6d0e-45be-b21e-83fe323047f0'::uuid, 'Otros trabajos CD', 'otros_trabajos_cd', false, true)
    ) as t(id, nombre, clave, protegida, archivada)
  loop
    update public.trabajo_categorias
    set clave = r.clave, protegida = r.protegida, archivada = r.archivada
    where id = r.id and nombre = r.nombre;
    get diagnostics n = row_count;
    if n <> 1 then
      raise exception 'Categoría % (%) no encontrada', r.nombre, r.id;
    end if;
  end loop;

  for r in
    select * from (values
      ('9595d715-d7eb-4c0d-85d7-cfea3168b600'::uuid, 'Lluvias y temporales', 'lluvias_temporales'),
      ('1d45e4d6-a687-4d4d-ae0b-8a5531fc88bb'::uuid, 'Revisiones y mantenciones periódicas', 'revisiones_mantenciones'),
      ('58af02ea-84d4-4ec1-b537-3f7bad8f33cf'::uuid, 'Fachadas', 'fachadas'),
      ('e8e0030d-2f2c-4b38-9c98-c3b0300448ef'::uuid, 'Clientes con patentes en proceso', 'clientes_patentes'),
      ('fe76839f-1d1f-4b88-bc1b-31ebc9e5b2da'::uuid, 'Proyecto recepción de obras', 'recepcion_obras')
    ) as t(id, nombre, clave)
  loop
    update public.trabajo_subtipos
    set clave = r.clave, protegida = true
    where id = r.id and nombre = r.nombre;
    get diagnostics n = row_count;
    if n <> 1 then
      raise exception 'Subcategoría % (%) no encontrada', r.nombre, r.id;
    end if;
  end loop;
end $$;

-- 3. La base bloquea borrados peligrosos --------------------------------------
-- SECURITY DEFINER para contar todos los trabajos, aunque el usuario no los vea.

create function public.menu_bloquear_borrado_subtipo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if old.protegida then
    raise exception 'No se puede eliminar «%»: es una subcategoría protegida.', old.nombre;
  end if;
  if exists (
    select 1 from public.trabajo_categorias c
    where c.id = old.categoria_id and c.archivada
  ) then
    raise exception 'No se puede eliminar «%»: su categoría está archivada.', old.nombre;
  end if;
  select count(*) into n from public.trabajos t where t.subtipo_id = old.id;
  if n > 0 then
    raise exception 'Tiene % trabajos; muévelos antes de eliminar.', n;
  end if;
  select count(*) into n from public.eventos e where e.subtipo_id = old.id;
  if n > 0 then
    raise exception 'Tiene % eventos; no se puede eliminar.', n;
  end if;
  return old;
end;
$$;

create function public.menu_bloquear_borrado_categoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if old.protegida then
    raise exception 'No se puede eliminar «%»: es una categoría protegida.', old.nombre;
  end if;
  if old.archivada then
    raise exception 'No se puede eliminar «%»: está archivada.', old.nombre;
  end if;
  if exists (
    select 1 from public.trabajo_subtipos s
    where s.categoria_id = old.id and s.protegida
  ) then
    raise exception 'No se puede eliminar «%»: tiene subcategorías protegidas.', old.nombre;
  end if;
  select count(*) into n
  from public.trabajos t
  where t.categoria_id = old.id
    or t.subtipo_id in (select s.id from public.trabajo_subtipos s where s.categoria_id = old.id);
  if n > 0 then
    raise exception 'Tiene % trabajos; muévelos antes de eliminar.', n;
  end if;
  select count(*) into n
  from public.eventos e
  join public.trabajo_subtipos s on s.id = e.subtipo_id
  where s.categoria_id = old.id;
  if n > 0 then
    raise exception 'Tiene % eventos; no se puede eliminar.', n;
  end if;
  return old;
end;
$$;

create trigger trabajo_subtipos_bloquear_borrado
  before delete on public.trabajo_subtipos
  for each row execute function public.menu_bloquear_borrado_subtipo();

create trigger trabajo_categorias_bloquear_borrado
  before delete on public.trabajo_categorias
  for each row execute function public.menu_bloquear_borrado_categoria();

-- 4. La app no puede cambiar las marcas internas ------------------------------
-- clave, protegida, archivada y owner_id solo se cambian directo en la base
-- (rol postgres). Tampoco se mueve una subcategoría a otra categoría ni se
-- edita una categoría archivada desde la app.

create function public.menu_proteger_campos_categoria()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.clave is not null or new.protegida or new.archivada then
      raise exception 'Una categoría nueva no puede venir con clave, protegida ni archivada.';
    end if;
    return new;
  end if;
  if old.archivada then
    raise exception 'La categoría «%» está archivada.', old.nombre;
  end if;
  if new.clave is distinct from old.clave
    or new.protegida is distinct from old.protegida
    or new.archivada is distinct from old.archivada
    or new.owner_id is distinct from old.owner_id
  then
    raise exception 'Esos campos de la categoría no se cambian desde la app.';
  end if;
  return new;
end;
$$;

create function public.menu_proteger_campos_subtipo()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if exists (
    select 1 from public.trabajo_categorias c
    where c.id = new.categoria_id and c.archivada
  ) then
    raise exception 'La categoría de esta subcategoría está archivada.';
  end if;
  if tg_op = 'INSERT' then
    if new.clave is not null or new.protegida then
      raise exception 'Una subcategoría nueva no puede venir con clave ni protegida.';
    end if;
    return new;
  end if;
  if new.clave is distinct from old.clave
    or new.protegida is distinct from old.protegida
    or new.categoria_id is distinct from old.categoria_id
  then
    raise exception 'Esos campos de la subcategoría no se cambian desde la app.';
  end if;
  return new;
end;
$$;

create trigger trabajo_categorias_proteger_campos
  before insert or update on public.trabajo_categorias
  for each row execute function public.menu_proteger_campos_categoria();

create trigger trabajo_subtipos_proteger_campos
  before insert or update on public.trabajo_subtipos
  for each row execute function public.menu_proteger_campos_subtipo();

-- 5. Solo admin y Pablo editan el menú ----------------------------------------
-- Restrictivas: se suman (AND) a las políticas actuales, que no se tocan.
-- La lectura no cambia.

create policy "Menu solo admin y pablo insertan categorias"
  on public.trabajo_categorias as restrictive for insert
  to authenticated
  with check (public.mi_rol() in ('admin', 'pablo'));

create policy "Menu solo admin y pablo editan categorias"
  on public.trabajo_categorias as restrictive for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'))
  with check (public.mi_rol() in ('admin', 'pablo'));

create policy "Menu solo admin y pablo borran categorias"
  on public.trabajo_categorias as restrictive for delete
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));

create policy "Menu solo admin y pablo insertan subtipos"
  on public.trabajo_subtipos as restrictive for insert
  to authenticated
  with check (public.mi_rol() in ('admin', 'pablo'));

create policy "Menu solo admin y pablo editan subtipos"
  on public.trabajo_subtipos as restrictive for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'))
  with check (public.mi_rol() in ('admin', 'pablo'));

create policy "Menu solo admin y pablo borran subtipos"
  on public.trabajo_subtipos as restrictive for delete
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));

-- 6. Guardar el menú en un solo paso ("Listo") --------------------------------
-- SECURITY INVOKER: corre con los permisos y el RLS de quien la llama.
-- Si algo falla (por ejemplo, un borrado bloqueado), no se guarda nada.
--
-- p = {
--   "categorias": [ { "id": uuid | null, "nombre": text, "color": text,
--                     "subtipos": [ { "id": uuid | null, "nombre": text } ] } ],
--   "eliminar_subtipos": [uuid],
--   "eliminar_categorias": [uuid]
-- }
-- El orden es la posición en cada lista. Las categorías que no vienen
-- (archivadas o privadas de otra persona) no se tocan.

create function public.guardar_menu_categorias(p jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_cat jsonb;
  v_sub jsonb;
  v_cat_id uuid;
  v_sub_id uuid;
  v_nombre text;
  v_color text;
  v_ids uuid[];
  v_n integer;
  i integer := 0;
  j integer;
begin
  if coalesce(public.mi_rol(), '') not in ('admin', 'pablo') then
    raise exception 'Solo admin y Pablo pueden editar el menú.' using errcode = '42501';
  end if;
  if jsonb_typeof(p -> 'categorias') is distinct from 'array' then
    raise exception 'Formato inválido: falta la lista de categorías.';
  end if;

  select coalesce(array_agg(x::uuid), '{}') into v_ids
  from jsonb_array_elements_text(coalesce(p -> 'eliminar_subtipos', '[]'::jsonb)) as x;
  if cardinality(v_ids) > 0 then
    delete from public.trabajo_subtipos where id = any (v_ids);
    get diagnostics v_n = row_count;
    if v_n <> cardinality(v_ids) then
      raise exception 'Una de las subcategorías a eliminar ya no existe o no es visible.';
    end if;
  end if;

  select coalesce(array_agg(x::uuid), '{}') into v_ids
  from jsonb_array_elements_text(coalesce(p -> 'eliminar_categorias', '[]'::jsonb)) as x;
  if cardinality(v_ids) > 0 then
    delete from public.trabajo_categorias where id = any (v_ids);
    get diagnostics v_n = row_count;
    if v_n <> cardinality(v_ids) then
      raise exception 'Una de las categorías a eliminar ya no existe o no es visible.';
    end if;
  end if;

  for v_cat in select value from jsonb_array_elements(p -> 'categorias')
  loop
    i := i + 1;
    v_nombre := btrim(coalesce(v_cat ->> 'nombre', ''));
    v_color := nullif(v_cat ->> 'color', '');
    if char_length(v_nombre) not between 1 and 80 then
      raise exception 'El nombre de una categoría debe tener entre 1 y 80 caracteres.';
    end if;

    if coalesce(v_cat ->> 'id', '') = '' then
      insert into public.trabajo_categorias (nombre, color, orden)
      values (v_nombre, v_color, i)
      returning id into v_cat_id;
    else
      v_cat_id := (v_cat ->> 'id')::uuid;
      update public.trabajo_categorias
      set nombre = v_nombre, color = v_color, orden = i
      where id = v_cat_id
        and (nombre, color, orden) is distinct from (v_nombre, v_color, i);
      if not exists (select 1 from public.trabajo_categorias where id = v_cat_id) then
        raise exception 'La categoría «%» ya no existe o no es visible.', v_nombre;
      end if;
    end if;

    j := 0;
    for v_sub in select value from jsonb_array_elements(coalesce(v_cat -> 'subtipos', '[]'::jsonb))
    loop
      j := j + 1;
      v_nombre := btrim(coalesce(v_sub ->> 'nombre', ''));
      if char_length(v_nombre) not between 1 and 80 then
        raise exception 'El nombre de una subcategoría debe tener entre 1 y 80 caracteres.';
      end if;

      if coalesce(v_sub ->> 'id', '') = '' then
        insert into public.trabajo_subtipos (categoria_id, nombre, orden)
        values (v_cat_id, v_nombre, j);
      else
        v_sub_id := (v_sub ->> 'id')::uuid;
        update public.trabajo_subtipos
        set nombre = v_nombre, orden = j
        where id = v_sub_id
          and categoria_id = v_cat_id
          and (nombre, orden) is distinct from (v_nombre, j);
        if not exists (
          select 1 from public.trabajo_subtipos
          where id = v_sub_id and categoria_id = v_cat_id
        ) then
          raise exception 'La subcategoría «%» ya no existe en esa categoría.', v_nombre;
        end if;
      end if;
    end loop;
  end loop;
end;
$$;

revoke execute on function public.guardar_menu_categorias(jsonb) from public, anon;
grant execute on function public.guardar_menu_categorias(jsonb) to authenticated;
