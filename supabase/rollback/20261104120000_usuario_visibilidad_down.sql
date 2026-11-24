-- Deshace 20261104120000. No borra trabajos, fotos, eventos, compras ni informes.
-- No ejecutar en producción sin un OK aparte.

drop policy if exists "Visibilidad trabajos" on public.trabajos;
drop policy if exists "Visibilidad eventos" on public.eventos;
drop policy if exists "Visibilidad trabajo_media" on public.trabajo_media;
drop policy if exists "Visibilidad compras_materiales" on public.compras_materiales;
drop policy if exists "Visibilidad compra_material_trabajos" on public.compra_material_trabajos;
drop policy if exists "Visibilidad informes_seguro" on public.informes_seguro;
drop policy if exists "Visibilidad informe_seguro_recintos" on public.informe_seguro_recintos;
drop policy if exists "Visibilidad informe_seguro_subproyectos" on public.informe_seguro_subproyectos;
drop policy if exists "Visibilidad informe_seguro_media" on public.informe_seguro_media;
drop policy if exists "Visibilidad informe_seguro_versiones" on public.informe_seguro_versiones;

do $$
declare
  t text;
begin
  foreach t in array array[
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
    'fachadas_reporte_versiones'
  ]
  loop
    execute format('drop policy if exists "Visibilidad fachadas" on public.%I', t);
  end loop;
end $$;

drop trigger if exists perfiles_bloquear_visibilidad on public.perfiles;
drop trigger if exists usuario_visibilidad_solo_admin on public.usuario_visibilidad;

drop function if exists public.guardar_visibilidad_usuario(uuid, boolean, jsonb);
drop function if exists public.ve_informe(uuid);
drop function if exists public.ve_compra(uuid);
drop function if exists public.ve_fachadas();
drop function if exists public.ve_media_sin_trabajo();
drop function if exists public.ve_trabajo(uuid);
drop function if exists public.ve_evento(uuid);
drop function if exists public.ve_categoria_o_subtipo(uuid, uuid);
drop function if exists public.usuario_visibilidad_solo_admin();
drop function if exists public.perfiles_bloquear_visibilidad();

drop table if exists public.usuario_visibilidad;

alter table public.perfiles drop column if exists visibilidad_personalizada;
