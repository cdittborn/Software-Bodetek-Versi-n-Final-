-- Solo lectura. Conteos antes de aplicar 20261008120000.
SET default_transaction_read_only = on;

select 'ya aplicada' as chequeo, version, name
from supabase_migrations.schema_migrations
where version = '20261008120000';

select 'columnas nuevas' as chequeo,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'fachadas'
      and column_name = 'svg_id'
  ) as fachadas_svg_id,
  to_regclass('public.fachada_recintos') is not null as fachada_recintos,
  to_regclass('public.fachadas_reportes') is not null as fachadas_reportes;

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

select 'local 1' as chequeo;
select
  id,
  nombre,
  recinto_id,
  (notas is null or btrim(notas) = '') as notas_vacias,
  alto_m,
  ancho_m,
  superficie_m2
from public.fachadas
where id = '95c58c33-5034-4403-977b-6bd04efb4310';

select 'archivos e intervencion' as chequeo,
  (select count(*) from public.fachada_archivos) as archivos,
  (select count(*) from public.fachada_intervenciones) as intervenciones;
