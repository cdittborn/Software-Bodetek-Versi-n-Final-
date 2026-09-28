-- Solo lectura. Verificar frecuencias por tipo (20260928180000).

select 'columnas frecuencia por tipo' as chequeo;
select column_name, column_default, is_nullable, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'fachadas'
  and column_name in (
    'frecuencia_limpieza_meses',
    'frecuencia_reparacion_meses',
    'frecuencia_pintura_meses',
    'frecuencia_revision_meses',
    'letra',
    'recinto_id'
  )
order by 1;

select 'checks frecuencia' as chequeo;
select conname, pg_get_constraintdef(oid) as def
from pg_constraint
where conrelid = 'public.fachadas'::regclass
  and conname in (
    'fachadas_frecuencia_limpieza_meses_check',
    'fachadas_frecuencia_reparacion_meses_check',
    'fachadas_frecuencia_pintura_meses_check',
    'fachadas_frecuencia_revision_meses_check'
  )
order by 1;

select 'revision y recinto intactos' as chequeo;
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'fachadas'
      and column_name = 'frecuencia_revision_meses')::int as tiene_revision,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'fachadas'
      and column_name = 'letra')::int as tiene_letra,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'fachadas'
      and column_name = 'recinto_id')::int as tiene_recinto;

select 'historial' as chequeo;
select version, name
from supabase_migrations.schema_migrations
where version in ('20260924120000', '20260928120000', '20260928180000')
order by 1;
