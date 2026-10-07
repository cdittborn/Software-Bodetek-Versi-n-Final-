-- Solo lectura. Verificar 20261006120000 en una conexión nueva.
SET default_transaction_read_only = on;

select 'registro' as chequeo, version, name
from supabase_migrations.schema_migrations
where version = '20261006120000';

select 'rls' as chequeo, c.relname, c.relrowsecurity as rls_activo
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'informes_seguro',
    'informe_seguro_recintos',
    'informe_seguro_subproyectos',
    'informe_seguro_media',
    'informe_seguro_versiones'
  )
order by c.relname;

select 'policies' as chequeo, c.relname as tabla, p.polname, p.polcmd
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'informes_seguro',
    'informe_seguro_recintos',
    'informe_seguro_subproyectos',
    'informe_seguro_media',
    'informe_seguro_versiones'
  )
order by c.relname, p.polname;

select 'grants authenticated' as chequeo, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'authenticated'
  and table_name in (
    'informes_seguro',
    'informe_seguro_recintos',
    'informe_seguro_subproyectos',
    'informe_seguro_media',
    'informe_seguro_versiones'
  )
order by table_name, privilege_type;

select 'grants anon' as chequeo, table_name, privilege_type, grantee
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'public')
  and table_name in (
    'informes_seguro',
    'informe_seguro_recintos',
    'informe_seguro_subproyectos',
    'informe_seguro_media',
    'informe_seguro_versiones'
  )
order by grantee, table_name, privilege_type;

select 'triggers' as chequeo, c.relname as tabla, t.tgname,
  pg_get_triggerdef(t.oid) as definicion
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and not t.tgisinternal
  and c.relname in (
    'informes_seguro',
    'informe_seguro_recintos',
    'informe_seguro_subproyectos',
    'informe_seguro_media',
    'informe_seguro_versiones'
  )
order by c.relname, t.tgname;

select 'filas nuevas' as chequeo, c.relname as tabla,
  (xpath('/row/c/text()', query_to_xml(
    format('select count(*) as c from public.%I', c.relname),
    false, true, ''
  )))[1]::text::int as n
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'informes_seguro',
    'informe_seguro_recintos',
    'informe_seguro_subproyectos',
    'informe_seguro_media',
    'informe_seguro_versiones'
  )
order by 2;

select 'conteos public' as chequeo;
select c.relname as tabla,
  (xpath('/row/c/text()', query_to_xml(
    format('select count(*) as c from %I.%I', n.nspname, c.relname),
    false, true, ''
  )))[1]::text::int as n
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by 1;
