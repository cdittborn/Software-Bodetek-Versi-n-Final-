-- Solo lectura. Verificar medidas opcionales (20260928210000).

select 'nullable medidas fachadas' as chequeo;
select column_name, is_nullable, data_type, numeric_precision, numeric_scale
from information_schema.columns
where table_schema = 'public'
  and table_name = 'fachadas'
  and column_name in ('alto_m', 'ancho_m', 'superficie_m2')
order by 1;

select 'nullable medidas snapshot' as chequeo;
select column_name, is_nullable, data_type, numeric_precision, numeric_scale
from information_schema.columns
where table_schema = 'public'
  and table_name = 'fachada_intervenciones'
  and column_name in (
    'alto_m_snapshot',
    'ancho_m_snapshot',
    'superficie_m2_snapshot'
  )
order by 1;

select 'checks > 0 siguen' as chequeo;
select conrelid::regclass as tabla, conname, pg_get_constraintdef(oid) as def
from pg_constraint
where conname in (
  'fachadas_alto_m_check',
  'fachadas_ancho_m_check',
  'fachadas_superficie_m2_check',
  'fachada_intervenciones_alto_snapshot_check',
  'fachada_intervenciones_ancho_snapshot_check',
  'fachada_intervenciones_superficie_snapshot_check'
)
order by 1, 2;

select 'filas con null (deben poder existir; no se migran datos)' as chequeo;
select
  (select count(*) from public.fachadas where alto_m is null)::int as fachadas_alto_null,
  (select count(*) from public.fachadas where ancho_m is null)::int as fachadas_ancho_null,
  (select count(*) from public.fachadas where superficie_m2 is null)::int as fachadas_m2_null,
  (select count(*) from public.fachada_intervenciones where alto_m_snapshot is null)::int as snap_alto_null,
  (select count(*) from public.fachada_intervenciones where ancho_m_snapshot is null)::int as snap_ancho_null,
  (select count(*) from public.fachada_intervenciones where superficie_m2_snapshot is null)::int as snap_m2_null;

select 'historial' as chequeo;
select version, name
from supabase_migrations.schema_migrations
where version in (
  '20260924120000',
  '20260928120000',
  '20260928180000',
  '20260928200000',
  '20260928210000'
)
order by 1;
