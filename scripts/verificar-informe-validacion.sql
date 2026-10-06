-- Solo lectura. Verificar 20261006233000 en una conexión nueva.
SET default_transaction_read_only = on;

select 'registro' as chequeo, version, name
from supabase_migrations.schema_migrations
where version in ('20261006120000', '20261006233000')
order by version;

select 'columnas recintos' as chequeo, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'informe_seguro_recintos'
  and column_name in ('descripcion_validada', 'validada_at', 'validada_por')
order by column_name;

select 'fk validada_por' as chequeo, conname
from pg_constraint
where conname like '%validada_por%';

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

select 'filas informe' as chequeo, c.relname as tabla,
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
