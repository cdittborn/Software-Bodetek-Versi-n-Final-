-- Deshace 20261103230000_menu_categorias.
-- Quita solo lo que agregó esa migración: políticas restrictivas, triggers,
-- funciones, índices, el check de color y las columnas nuevas.
-- No borra filas. Las categorías creadas, renombradas o eliminadas desde el
-- editor quedan como estén; se pierden solo orden, color, clave, protegida
-- y archivada. Ejecutar solo junto con el código anterior a la fase 2.

drop policy if exists "Menu solo admin y pablo insertan categorias" on public.trabajo_categorias;
drop policy if exists "Menu solo admin y pablo editan categorias" on public.trabajo_categorias;
drop policy if exists "Menu solo admin y pablo borran categorias" on public.trabajo_categorias;
drop policy if exists "Menu solo admin y pablo insertan subtipos" on public.trabajo_subtipos;
drop policy if exists "Menu solo admin y pablo editan subtipos" on public.trabajo_subtipos;
drop policy if exists "Menu solo admin y pablo borran subtipos" on public.trabajo_subtipos;

drop function if exists public.guardar_menu_categorias(jsonb);

drop trigger if exists trabajo_categorias_proteger_campos on public.trabajo_categorias;
drop trigger if exists trabajo_subtipos_proteger_campos on public.trabajo_subtipos;
drop trigger if exists trabajo_categorias_bloquear_borrado on public.trabajo_categorias;
drop trigger if exists trabajo_subtipos_bloquear_borrado on public.trabajo_subtipos;

drop function if exists public.menu_proteger_campos_categoria();
drop function if exists public.menu_proteger_campos_subtipo();
drop function if exists public.menu_bloquear_borrado_categoria();
drop function if exists public.menu_bloquear_borrado_subtipo();

drop index if exists public.trabajo_categorias_clave_key;
drop index if exists public.trabajo_subtipos_clave_key;

alter table public.trabajo_categorias drop constraint if exists trabajo_categorias_color_paleta;

alter table public.trabajo_categorias
  drop column if exists orden,
  drop column if exists color,
  drop column if exists clave,
  drop column if exists protegida,
  drop column if exists archivada;

alter table public.trabajo_subtipos
  drop column if exists orden,
  drop column if exists clave,
  drop column if exists protegida;
