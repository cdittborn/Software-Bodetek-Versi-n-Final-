-- Solo lectura. Revisa 20261103230000_menu_categorias después de aplicarla.
-- Falla (RAISE) si un criterio no se cumple.
SET default_transaction_read_only = on;

select 'registro' as chequeo, version, name
from supabase_migrations.schema_migrations
where version = '20261103230000';

select 'categorías' as chequeo, orden, color, clave, protegida, archivada, nombre
from public.trabajo_categorias
order by orden;

select 'subcategorías' as chequeo, c.orden as cat, s.orden, s.clave, s.protegida, s.nombre
from public.trabajo_subtipos s
join public.trabajo_categorias c on c.id = s.categoria_id
order by c.orden, s.orden;

select 'políticas nuevas' as chequeo, tablename, policyname, permissive, cmd
from pg_policies
where policyname like 'Menu solo admin y pablo %'
order by 1, 2;

do $$
declare
  n integer;
begin
  if not exists (select 1 from supabase_migrations.schema_migrations where version = '20261103230000') then
    raise exception 'falta el registro en schema_migrations';
  end if;

  select count(*) into n from public.trabajo_categorias;
  if n <> 7 then raise exception 'trabajo_categorias: % filas, se esperaban 7', n; end if;
  select count(*) into n from public.trabajo_subtipos;
  if n <> 17 then raise exception 'trabajo_subtipos: % filas, se esperaban 17', n; end if;

  if exists (select 1 from public.trabajo_categorias where orden is null or color is null) then
    raise exception 'hay categorías sin orden o sin color';
  end if;
  if exists (select 1 from public.trabajo_subtipos where orden is null) then
    raise exception 'hay subcategorías sin orden';
  end if;

  if (select array_agg(nombre order by nombre) from public.trabajo_categorias where archivada)
     is distinct from array['Otros trabajos CD'] then
    raise exception 'archivada debe estar solo en Otros trabajos CD';
  end if;

  if (select array_agg(clave order by clave) from public.trabajo_categorias where protegida)
     is distinct from array['imagen', 'patentes', 'techumbres'] then
    raise exception 'categorías protegidas inesperadas';
  end if;

  if (select array_agg(id::text || '=' || clave order by clave) from public.trabajo_subtipos where protegida)
     is distinct from array[
       'e8e0030d-2f2c-4b38-9c98-c3b0300448ef=clientes_patentes',
       '58af02ea-84d4-4ec1-b537-3f7bad8f33cf=fachadas',
       '9595d715-d7eb-4c0d-85d7-cfea3168b600=lluvias_temporales',
       'fe76839f-1d1f-4b88-bc1b-31ebc9e5b2da=recepcion_obras',
       '1d45e4d6-a687-4d4d-ae0b-8a5531fc88bb=revisiones_mantenciones'
     ] then
    raise exception 'subcategorías protegidas o claves inesperadas';
  end if;

  select count(*) into n from pg_policies
  where policyname like 'Menu solo admin y pablo %' and permissive = 'RESTRICTIVE';
  if n <> 6 then raise exception 'se esperaban 6 políticas restrictivas, hay %', n; end if;

  select count(*) into n from pg_policies
  where tablename in ('trabajo_categorias', 'trabajo_subtipos') and permissive = 'PERMISSIVE';
  if n <> 8 then raise exception 'las 8 políticas anteriores deberían seguir, hay %', n; end if;

  select count(*) into n from pg_trigger
  where not tgisinternal and tgname in (
    'trabajo_categorias_bloquear_borrado', 'trabajo_subtipos_bloquear_borrado',
    'trabajo_categorias_proteger_campos', 'trabajo_subtipos_proteger_campos'
  );
  if n <> 4 then raise exception 'se esperaban 4 triggers, hay %', n; end if;

  if not has_function_privilege('authenticated', 'public.guardar_menu_categorias(jsonb)', 'execute') then
    raise exception 'authenticated debería poder ejecutar guardar_menu_categorias';
  end if;
  if has_function_privilege('anon', 'public.guardar_menu_categorias(jsonb)', 'execute') then
    raise exception 'anon no debería poder ejecutar guardar_menu_categorias';
  end if;
  if (select prosecdef from pg_proc where oid = 'public.guardar_menu_categorias(jsonb)'::regprocedure) then
    raise exception 'guardar_menu_categorias debe ser SECURITY INVOKER';
  end if;
end $$;

select 'OK' as resultado;
