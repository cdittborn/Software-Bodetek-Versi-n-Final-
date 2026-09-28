-- Solo lectura. Verificar fechas base (20260928200000).

select 'columnas ultima_*_fecha' as chequeo;
select column_name, column_default, is_nullable, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'fachadas'
  and column_name in (
    'ultima_limpieza_fecha',
    'ultima_reparacion_fecha',
    'ultima_pintura_fecha',
    'frecuencia_limpieza_meses',
    'frecuencia_reparacion_meses',
    'frecuencia_pintura_meses'
  )
order by 1;

select 'checks fechas base' as chequeo;
select conname, pg_get_constraintdef(oid) as def
from pg_constraint
where conrelid = 'public.fachadas'::regclass
  and conname in (
    'fachadas_ultima_limpieza_fecha_check',
    'fachadas_ultima_reparacion_fecha_check',
    'fachadas_ultima_pintura_fecha_check'
  )
order by 1;

select 'frecuencias intactas' as chequeo;
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'fachadas'
      and column_name = 'frecuencia_limpieza_meses')::int as tiene_freq_limpieza,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'fachadas'
      and column_name = 'frecuencia_reparacion_meses')::int as tiene_freq_reparacion,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'fachadas'
      and column_name = 'frecuencia_pintura_meses')::int as tiene_freq_pintura;

select 'historial' as chequeo;
select version, name
from supabase_migrations.schema_migrations
where version in (
  '20260924120000',
  '20260928120000',
  '20260928180000',
  '20260928200000'
)
order by 1;
