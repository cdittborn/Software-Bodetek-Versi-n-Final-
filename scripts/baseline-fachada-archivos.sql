-- Solo lectura. Conteos antes de aplicar 20261005120000.
SET default_transaction_read_only = on;

select 'ya aplicada' as chequeo, version, name
from supabase_migrations.schema_migrations
where version = '20261005120000';

select 'tabla fachada_archivos existe' as chequeo,
  to_regclass('public.fachada_archivos') is not null as existe;

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
  (plano_key is not null and btrim(plano_key) <> '') as tiene_plano,
  plano_nombre,
  (foto_key is not null and btrim(foto_key) <> '') as tiene_foto,
  foto_nombre,
  alto_m,
  ancho_m,
  superficie_m2,
  ultima_limpieza_fecha,
  ultima_reparacion_fecha,
  ultima_pintura_fecha
from public.fachadas
order by nombre;
