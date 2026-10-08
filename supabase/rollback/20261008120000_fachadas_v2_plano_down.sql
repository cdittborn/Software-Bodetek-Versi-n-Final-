-- Deshace 20261008120000_fachadas_v2_plano y el seed que la acompaña.
-- Borra las 68 fachadas insertadas por el seed. Conserva 95c58c33… con sus
-- archivos e intervención, y le devuelve el nombre y las medidas previas
-- (alto 20, ancho 9, 180 m², sin recinto). No ejecutar salvo OK explícito.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'fachadas'
      and column_name = 'svg_id'
  ) then
    delete from public.fachadas
    where svg_id is not null
      and id <> '95c58c33-5034-4403-977b-6bd04efb4310';

    update public.fachadas
    set
      nombre = 'Local 1 - Rio Cristal - Fachada trasera (Calle interior acceso V. Jara)',
      alto_m = 20,
      ancho_m = 9,
      superficie_m2 = 180,
      recinto_id = null,
      notas = case
        when notas = 'Local 1 - Rio Cristal - Fachada trasera (Calle interior acceso V. Jara)'
          then null
        else notas
      end
    where id = '95c58c33-5034-4403-977b-6bd04efb4310'
      and svg_id = 's1-local-1-f1';
  end if;
end $$;

drop table if exists public.fachadas_reporte_versiones;
drop table if exists public.fachadas_reportes;
drop table if exists public.fachada_recintos;

alter table public.fachadas drop constraint if exists fachadas_svg_id_key;
alter table public.fachadas drop constraint if exists fachadas_ubicacion_check;
alter table public.fachadas drop constraint if exists fachadas_tipo_espacio_check;
alter table public.fachadas drop constraint if exists fachadas_orden_check;
alter table public.fachadas drop constraint if exists fachadas_largo_plano_m_check;

alter table public.fachadas drop column if exists svg_id;
alter table public.fachadas drop column if exists ubicacion;
alter table public.fachadas drop column if exists tipo_espacio;
alter table public.fachadas drop column if exists unidad_label;
alter table public.fachadas drop column if exists orden;
alter table public.fachadas drop column if exists largo_plano_m;
alter table public.fachadas drop column if exists evaluada_en;

comment on column public.fachadas.recinto_id is
  'Recinto asociado. Null = fachada general. ON DELETE SET NULL.';

drop index if exists public.fachada_archivos_portada_unica;

alter table public.fachada_archivos drop constraint if exists fachada_archivos_momento_check;
alter table public.fachada_archivos drop constraint if exists fachada_archivos_duracion_seg_check;
alter table public.fachada_archivos drop column if exists momento;
alter table public.fachada_archivos drop column if exists duracion_seg;

create unique index fachada_archivos_portada_unica
  on public.fachada_archivos (fachada_id)
  where es_portada;

comment on column public.fachada_archivos.es_portada is
  'Máximo una portada por fachada, y solo si es foto (índice único parcial).';

delete from public.recintos
where tipo = 'area_comun'
  and (sitio, galpon, codigo) in (
    ('1', '', 'TALLER MAESTROS'),
    ('1', '', 'BANOS COMUNES'),
    ('1', '', 'COMEDOR'),
    ('2', '', 'BODEGA MAESTROS'),
    ('2', '', 'OFICINA ADMINISTRACION')
  );

delete from supabase_migrations.schema_migrations
where version = '20261008120000';
