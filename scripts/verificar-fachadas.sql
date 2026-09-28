-- Solo lectura. Verificar Fachadas en prod.

select 'tablas' as chequeo;
select c.relname as tabla, c.relrowsecurity as rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'proveedor_rubros',
    'fachadas',
    'fachada_intervenciones',
    'fachada_intervencion_tipos',
    'fachada_cotizaciones',
    'fachada_cotizacion_tipos',
    'fachada_hojalateria',
    'fachada_materiales',
    'fachada_media'
  )
order by 1;

select 'funcion' as chequeo;
select n.nspname as schema, p.proname as nombre,
       pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'set_updated_at';

select 'policies' as chequeo;
select tablename, count(*)::int as n_policies
from pg_policies
where schemaname = 'public'
  and tablename in (
    'proveedor_rubros',
    'fachadas',
    'fachada_intervenciones',
    'fachada_intervencion_tipos',
    'fachada_cotizaciones',
    'fachada_cotizacion_tipos',
    'fachada_hojalateria',
    'fachada_materiales',
    'fachada_media'
  )
group by tablename
order by 1;

select 'triggers' as chequeo;
select event_object_table as tabla, trigger_name
from information_schema.triggers
where event_object_schema = 'public'
  and trigger_name in (
    'fachadas_set_updated_at',
    'fachada_intervenciones_set_updated_at'
  )
group by event_object_table, trigger_name
order by 1;

select 'historial' as chequeo;
select version, name
from supabase_migrations.schema_migrations
where version = '20260924120000';
