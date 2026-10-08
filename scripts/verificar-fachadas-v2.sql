-- Solo lectura. Criterios de la fase 0 después de migración + seed.
-- Falla (RAISE) si un criterio no se cumple.
SET default_transaction_read_only = on;

select 'registro' as chequeo, version, name
from supabase_migrations.schema_migrations
where version = '20261008120000';

select 'fachadas' as chequeo,
  count(*) as total,
  count(*) filter (where svg_id is not null) as con_svg,
  count(*) filter (where ubicacion = 'exterior') as exterior,
  count(*) filter (where ubicacion = 'interior') as interior,
  count(*) filter (where tipo_espacio = 'unidad') as unidad,
  count(*) filter (where tipo_espacio = 'compartida') as compartida,
  count(*) filter (where tipo_espacio = 'espacio_comun') as espacio_comun,
  count(*) filter (where tipo_espacio = 'perimetro') as perimetro,
  count(*) filter (where evaluada_en is null) as sin_evaluar,
  count(*) filter (where alto_m is null) as alto_null,
  count(*) filter (where superficie_m2 is null) as superficie_null
from public.fachadas;

select 'local 1 adoptada' as chequeo,
  id,
  svg_id,
  nombre,
  notas,
  ancho_m,
  largo_plano_m,
  alto_m,
  superficie_m2,
  evaluada_en
from public.fachadas
where id = '95c58c33-5034-4403-977b-6bd04efb4310';

select 's1-local-4-f1' as chequeo, r.sitio, r.codigo, r.nombre
from public.fachadas f
join public.fachada_recintos fr on fr.fachada_id = f.id
join public.recintos r on r.id = fr.recinto_id
where f.svg_id = 's1-local-4-f1'
order by r.sitio, r.codigo;

select 'compartidas' as chequeo, f.svg_id, count(*) as vinculos
from public.fachadas f
join public.fachada_recintos fr on fr.fachada_id = f.id
where f.tipo_espacio = 'compartida'
group by f.svg_id
order by f.svg_id;

select 'bodega 7 u 8' as chequeo, count(*) as vinculos
from public.fachada_recintos fr
join public.recintos r on r.id = fr.recinto_id
where r.sitio = '2'
  and r.codigo in ('7', '8');

select 'archivos' as chequeo,
  count(*) as n,
  count(*) filter (where momento = 'antes') as antes,
  count(*) filter (where momento = 'despues') as despues
from public.fachada_archivos;

select 'intervencion' as chequeo,
  id,
  fachada_id,
  estado,
  alto_m_snapshot,
  ancho_m_snapshot,
  superficie_m2_snapshot
from public.fachada_intervenciones
where fachada_id = '95c58c33-5034-4403-977b-6bd04efb4310';

select 'areas comunes nuevas' as chequeo, sitio, codigo, nombre
from public.recintos
where tipo = 'area_comun'
  and codigo in (
    'TALLER MAESTROS',
    'BANOS COMUNES',
    'COMEDOR',
    'BODEGA MAESTROS',
    'OFICINA ADMINISTRACION'
  )
order by sitio, codigo;

select 'indice portada' as chequeo, indexdef
from pg_indexes
where schemaname = 'public'
  and indexname = 'fachada_archivos_portada_unica';

select 'update en versiones' as chequeo, count(*) as policies_update
from pg_policy
where polrelid = 'public.fachadas_reporte_versiones'::regclass
  and polcmd = 'w';

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

do $$
declare
  n int;
begin
  if (
    select count(*)
    from supabase_migrations.schema_migrations
    where version = '20261008120000'
  ) <> 1 then
    raise exception 'falta el registro 20261008120000';
  end if;

  select count(*) into n from public.fachadas;
  if n <> 69 then
    raise exception 'fachadas = %, se esperaban 69', n;
  end if;
  select count(*) into n from public.fachadas where svg_id is not null;
  if n <> 69 then
    raise exception 'fachadas con svg_id = %, se esperaban 69', n;
  end if;

  if (select count(*) from public.fachadas where ubicacion = 'exterior') <> 18
     or (select count(*) from public.fachadas where ubicacion = 'interior') <> 51 then
    raise exception 'ubicacion distinta de 18 exterior / 51 interior';
  end if;

  if (select count(*) from public.fachadas where tipo_espacio = 'unidad') <> 55
     or (select count(*) from public.fachadas where tipo_espacio = 'compartida') <> 4
     or (select count(*) from public.fachadas where tipo_espacio = 'espacio_comun') <> 6
     or (select count(*) from public.fachadas where tipo_espacio = 'perimetro') <> 4 then
    raise exception 'tipo_espacio distinto de 55/4/6/4';
  end if;

  if exists (
    select 1
    from public.fachada_recintos fr
    join public.recintos r on r.id = fr.recinto_id
    where r.sitio = '2' and r.codigo in ('7', '8')
  ) or exists (
    select 1
    from public.fachadas f
    join public.recintos r on r.id = f.recinto_id
    where r.sitio = '2' and r.codigo in ('7', '8')
  ) then
    raise exception 'hay una fachada vinculada a Bodega 7 u 8';
  end if;

  if not exists (
    select 1
    from public.fachadas f
    join public.recintos r on r.id = f.recinto_id
    where f.svg_id = 's1-local-4-f1'
      and r.sitio = '1'
      and r.codigo = 'LOCAL 4'
  ) or exists (
    select 1
    from public.fachada_recintos fr
    join public.fachadas f on f.id = fr.fachada_id
    join public.recintos r on r.id = fr.recinto_id
    where f.svg_id = 's1-local-4-f1'
      and r.sitio = '2'
  ) then
    raise exception 's1-local-4-f1 no quedó en el recinto (1, LOCAL 4)';
  end if;

  if exists (
    select 1
    from public.fachadas f
    left join public.fachada_recintos fr on fr.fachada_id = f.id
    where f.tipo_espacio = 'compartida'
    group by f.id
    having count(fr.recinto_id) < 2
  ) then
    raise exception 'una compartida tiene menos de 2 vínculos';
  end if;

  select count(*) into n
  from public.fachada_recintos fr
  join public.fachadas f on f.id = fr.fachada_id
  where f.svg_id = 's2-frente-iquique-f1';
  if n <> 5 then
    raise exception 's2-frente-iquique-f1 tiene % vínculos, se esperaban 5', n;
  end if;

  select count(*) into n from public.fachada_archivos;
  if n <> 10 then
    raise exception 'fachada_archivos = %, se esperaban 10', n;
  end if;
  if exists (select 1 from public.fachada_archivos where momento is distinct from 'antes') then
    raise exception 'hay archivos con momento distinto de antes';
  end if;

  if (
    select count(*)
    from public.fachada_intervenciones
    where fachada_id = '95c58c33-5034-4403-977b-6bd04efb4310'
      and id = '5709da4d-5bd5-40d5-9075-81fdf36e7c45'
      and estado = 'programada'
      and alto_m_snapshot = 20
      and ancho_m_snapshot = 9
      and superficie_m2_snapshot = 180
  ) <> 1 then
    raise exception 'la intervención existente no quedó intacta';
  end if;

  if (
    select count(*)
    from public.recintos
    where tipo = 'area_comun'
      and (sitio, codigo) in (
        ('1', 'TALLER MAESTROS'),
        ('1', 'BANOS COMUNES'),
        ('1', 'COMEDOR'),
        ('2', 'BODEGA MAESTROS'),
        ('2', 'OFICINA ADMINISTRACION')
      )
  ) <> 5 then
    raise exception 'faltan espacios comunes';
  end if;

  if exists (
    select 1
    from public.fachadas
    where svg_id in (
      's1-acceso-f1',
      's2-cierre-huasco-f1',
      's2-cierre-huasco-f2',
      's2-cierre-huasco-f3',
      's2-cierre-huasco-f4'
    )
      and recinto_id is not null
  ) then
    raise exception 'Acceso o Cierre Huasco quedó con recinto';
  end if;

  if exists (
    select 1
    from pg_policy
    where polrelid = 'public.fachadas_reporte_versiones'::regclass
      and polcmd = 'w'
  ) then
    raise exception 'fachadas_reporte_versiones no debe tener policy de UPDATE';
  end if;

  if exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'fachadas_reporte_versiones'
      and grantee = 'authenticated'
      and privilege_type = 'UPDATE'
  ) then
    raise exception 'authenticated no debe poder UPDATE fachadas_reporte_versiones';
  end if;
end $$;
