-- OK de Cristóbal el 7 de noviembre de 2026.
-- Aplicar con scripts/aplicar-menu-solo-gerente-commit.sh.
-- Aditiva: no borra políticas, columnas ni filas al correr.
-- Las dos sentencias delete de más abajo viven dentro de la función y solo
-- corren cuando alguien guarda el menú, igual que hoy. Esta migración no las ejecuta.
--
-- Las políticas viejas "Menu solo admin y pablo …" se quedan.
-- Estas nuevas son AS RESTRICTIVE, así que se suman con AND:
-- hace falta ser Gerente General (rol admin) para insertar, editar o borrar.

create policy "Menu solo gerente inserta categorias"
  on public.trabajo_categorias as restrictive for insert
  to authenticated
  with check (public.mi_rol() = 'admin');

create policy "Menu solo gerente edita categorias"
  on public.trabajo_categorias as restrictive for update
  to authenticated
  using (public.mi_rol() = 'admin')
  with check (public.mi_rol() = 'admin');

create policy "Menu solo gerente borra categorias"
  on public.trabajo_categorias as restrictive for delete
  to authenticated
  using (public.mi_rol() = 'admin');

create policy "Menu solo gerente inserta subtipos"
  on public.trabajo_subtipos as restrictive for insert
  to authenticated
  with check (public.mi_rol() = 'admin');

create policy "Menu solo gerente edita subtipos"
  on public.trabajo_subtipos as restrictive for update
  to authenticated
  using (public.mi_rol() = 'admin')
  with check (public.mi_rol() = 'admin');

create policy "Menu solo gerente borra subtipos"
  on public.trabajo_subtipos as restrictive for delete
  to authenticated
  using (public.mi_rol() = 'admin');

create or replace function public.guardar_menu_categorias(p jsonb)
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
  if coalesce(public.mi_rol(), '') <> 'admin' then
    raise exception 'Solo el Gerente General puede editar el menú.' using errcode = '42501';
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
