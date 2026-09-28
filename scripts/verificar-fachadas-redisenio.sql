-- Solo lectura. Verificar rediseño Fachadas (20260928120000).

select 'columnas fachadas' as chequeo;
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'fachadas'
  and column_name in ('frecuencia_revision_meses', 'letra')
order by 1;

select 'estados intervencion' as chequeo;
select pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.fachada_intervenciones'::regclass
  and conname = 'fachada_intervenciones_estado_check';

select 'documentos' as chequeo;
select c.relname, c.relrowsecurity as rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'fachada_documentos';

select 'policies documentos' as chequeo;
select count(*)::int as n_policies
from pg_policies
where schemaname = 'public'
  and tablename = 'fachada_documentos';

select 'media portada' as chequeo;
select indexname
from pg_indexes
where schemaname = 'public'
  and indexname = 'fachada_media_portada_unica';

select 'materiales tipo' as chequeo;
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'fachada_materiales'
  and column_name = 'tipo';

select 'tablas legacy intactas' as chequeo;
select c.relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in ('fachada_cotizaciones', 'fachada_cotizacion_tipos', 'fachada_hojalateria')
order by 1;

select 'historial' as chequeo;
select version, name
from supabase_migrations.schema_migrations
where version in ('20260924120000', '20260928120000')
order by 1;
