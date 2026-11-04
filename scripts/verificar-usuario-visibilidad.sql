-- Solo lectura. Revisa 20261104120000 justo después de aplicarla.
-- No mira cuántas filas de trabajos hay: eso lo compara el script de aplicación.
SET default_transaction_read_only = on;

select 'registro' as chequeo, version, name
from supabase_migrations.schema_migrations
where version = '20261104120000';

select 'marca' as chequeo, count(*) as personas,
  count(*) filter (where visibilidad_personalizada) as con_recorte,
  count(*) filter (where rol = 'admin' and visibilidad_personalizada) as admins_recortados
from public.perfiles;

select 'filas de visibilidad' as chequeo, count(*) as n
from public.usuario_visibilidad;

select 'politicas' as chequeo, tablename, policyname
from pg_policies
where schemaname = 'public'
  and policyname like 'Visibilidad %'
order by tablename, policyname;

do $$
declare
  n integer;
  tablas text[] := array[
    'trabajos',
    'eventos',
    'trabajo_media',
    'compras_materiales',
    'compra_material_trabajos',
    'fachadas',
    'fachada_intervenciones',
    'fachada_intervencion_tipos',
    'fachada_cotizaciones',
    'fachada_cotizacion_tipos',
    'fachada_hojalateria',
    'fachada_materiales',
    'fachada_media',
    'fachada_documentos',
    'fachada_archivos',
    'fachada_recintos',
    'fachadas_reportes',
    'fachadas_reporte_versiones',
    'informes_seguro',
    'informe_seguro_recintos',
    'informe_seguro_subproyectos',
    'informe_seguro_media',
    'informe_seguro_versiones'
  ];
  t text;
begin
  if not exists (
    select 1 from supabase_migrations.schema_migrations where version = '20261104120000'
  ) then
    raise exception 'falta el registro en schema_migrations';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'perfiles'
      and column_name = 'visibilidad_personalizada'
      and data_type = 'boolean'
      and is_nullable = 'NO'
      and column_default = 'false'
  ) then
    raise exception 'la marca visibilidad_personalizada no quedó en false por defecto';
  end if;

  if exists (
    select 1 from public.perfiles
    where rol = 'admin' and visibilidad_personalizada
  ) then
    raise exception 'un administrador quedó marcado como restringido';
  end if;

  select count(*) into n from pg_policies
  where schemaname = 'public'
    and policyname like 'Visibilidad %'
    and permissive = 'RESTRICTIVE'
    and cmd = 'SELECT';
  if n <> 23 then
    raise exception 'se esperaban 23 políticas de lectura y hay %', n;
  end if;

  foreach t in array tablas loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname like 'Visibilidad %'
    ) then
      raise exception 'falta la política de visibilidad en %', t;
    end if;
  end loop;

  -- Las políticas viejas, las del rol, siguen ahí.
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'trabajos'
      and policyname = 'Select trabajos publicos por rol o privados propios'
      and permissive = 'PERMISSIVE'
  ) then
    raise exception 'se perdió la política de lectura de trabajos que ya existía';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'eventos'
      and policyname = 'Roles can select eventos'
  ) then
    raise exception 'se perdió la política de lectura de eventos que ya existía';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'informes_seguro'
      and policyname = 'informes_seguro_select_admin_pablo'
  ) then
    raise exception 'se perdió la política de lectura del informe que ya existía';
  end if;

  if has_table_privilege('authenticated', 'public.usuario_visibilidad', 'INSERT') then
    raise exception 'authenticated no debería poder insertar visibilidad directo';
  end if;
  if not has_table_privilege('authenticated', 'public.usuario_visibilidad', 'SELECT') then
    raise exception 'authenticated debería poder leer la visibilidad';
  end if;

  select count(*) into n
  from pg_proc
  where pronamespace = 'public'::regnamespace
    and proname = 'guardar_visibilidad_usuario';
  if n <> 1 then
    raise exception 'falta guardar_visibilidad_usuario';
  end if;
end $$;
