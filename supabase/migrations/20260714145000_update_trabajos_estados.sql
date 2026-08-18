-- Alinea estados de trabajos con el vocabulario del producto.
-- Antes: pendiente | en_progreso | completado | cancelado
-- Ahora: planificado | en_curso | completado | mantencion_periodica

update public.trabajos
set estado = case estado
  when 'pendiente' then 'planificado'
  when 'en_progreso' then 'en_curso'
  when 'cancelado' then 'planificado'
  else estado
end
where estado in ('pendiente', 'en_progreso', 'cancelado');

alter table public.trabajos
  drop constraint if exists trabajos_estado_check;

alter table public.trabajos
  alter column estado set default 'planificado';

alter table public.trabajos
  add constraint trabajos_estado_check
  check (
    estado in (
      'planificado',
      'en_curso',
      'completado',
      'mantencion_periodica'
    )
  );
