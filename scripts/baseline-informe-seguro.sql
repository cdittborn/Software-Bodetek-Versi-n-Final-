-- Solo lectura. Conteos antes de aplicar 20261006120000.
SET default_transaction_read_only = on;

select 'ya aplicada' as chequeo, version, name
from supabase_migrations.schema_migrations
where version = '20261006120000';

select 'tablas informe' as chequeo, nombre, to_regclass(nombre) is not null as existe
from (values
  ('public.informes_seguro'),
  ('public.informe_seguro_recintos'),
  ('public.informe_seguro_subproyectos'),
  ('public.informe_seguro_media'),
  ('public.informe_seguro_versiones')
) as t(nombre);

select 'set_updated_at' as chequeo, p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'set_updated_at';

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
