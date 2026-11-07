-- Solo lectura. Revisa 20261107180000 justo después de aplicarla.
SET default_transaction_read_only = on;

select 'registro' as chequeo, version, name
from supabase_migrations.schema_migrations
where version = '20261107180000';

select 'politica' as chequeo, tablename, policyname, permissive
from pg_policies
where schemaname = 'public'
  and (
    policyname like 'Menu solo gerente %'
    or policyname like 'Menu solo admin y pablo %'
  )
order by tablename, policyname;

select 'grants' as chequeo, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name = 'guardar_menu_categorias'
order by 2, 3;

select 'funcion' as chequeo,
  position('not in (''admin'', ''pablo'')' in pg_get_functiondef('public.guardar_menu_categorias(jsonb)'::regprocedure)) as queda_pablo,
  position('<> ''admin''' in pg_get_functiondef('public.guardar_menu_categorias(jsonb)'::regprocedure)) as solo_admin,
  position('Solo el Gerente General puede editar el menú.' in pg_get_functiondef('public.guardar_menu_categorias(jsonb)'::regprocedure)) as mensaje;
