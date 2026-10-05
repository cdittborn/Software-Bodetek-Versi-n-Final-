-- Solo lectura. Verificar 20261005120000 en una conexión nueva.
SET default_transaction_read_only = on;

select 'registro' as chequeo, version, name
from supabase_migrations.schema_migrations
where version = '20261005120000';

select 'rls' as chequeo, c.relname, c.relrowsecurity as rls_activo
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'fachada_archivos';

select 'policies' as chequeo, polname, polcmd
from pg_policy
where polrelid = 'public.fachada_archivos'::regclass
order by polname;

select 'checks' as chequeo, conname, pg_get_constraintdef(oid) as def
from pg_constraint
where conrelid = 'public.fachada_archivos'::regclass
  and contype = 'c'
order by conname;

select 'indices' as chequeo, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'fachada_archivos'
order by indexname;

select 'copiadas desde foto_key' as chequeo, count(*)::int as n
from public.fachada_archivos a
join public.fachadas f on f.id = a.fachada_id
where a.object_key = f.foto_key;

select 'portadas' as chequeo,
  f.nombre,
  a.tipo_archivo,
  a.es_portada,
  a.nombre_archivo,
  a.orden,
  (f.foto_key is not null) as foto_key_sigue
from public.fachada_archivos a
join public.fachadas f on f.id = a.fachada_id
order by f.nombre, a.orden;

select 'local 1' as chequeo;
select
  nombre,
  (plano_key is not null and btrim(plano_key) <> '') as tiene_plano,
  plano_nombre,
  (foto_key is not null and btrim(foto_key) <> '') as tiene_foto,
  foto_nombre,
  superficie_m2,
  ultima_limpieza_fecha,
  ultima_reparacion_fecha,
  ultima_pintura_fecha
from public.fachadas
order by nombre;

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
