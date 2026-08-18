-- Emergencias (submódulo de Trabajos) + media foto/video
--
-- Decisiones:
-- 1. Una emergencia ES un trabajo: misma tabla public.trabajos, identificada por
--    categoría "Techumbres y canales" + subtipo "Emergencias".
-- 2. trabajos.estado acepta los valores históricos Y los de emergencia:
--      planificado | en_curso | completado | mantencion_periodica
--      pendiente | en_proceso | terminado
--    Los trabajos que no son emergencia siguen usando el vocabulario original.
-- 3. plan_accion es extra de emergencia; queda nullable en trabajos.
-- 4. trabajo_fotos pasa a trabajo_media (misma tabla, nuevo nombre) con
--    tipo_archivo foto|video. El momento (antes/despues) sigue en "tipo".

-- ========== catálogo ==========
insert into public.trabajo_categorias (nombre)
values ('Techumbres y canales')
on conflict (nombre) do nothing;

insert into public.trabajo_subtipos (categoria_id, nombre)
select c.id, 'Emergencias'
from public.trabajo_categorias as c
where c.nombre = 'Techumbres y canales'
on conflict (categoria_id, nombre) do nothing;

-- ========== extra de emergencia en el trabajo ==========
alter table public.trabajos
  add column if not exists plan_accion text;

comment on column public.trabajos.plan_accion is
  'Plan de acción (texto libre). Principalmente para subtipo Emergencias; nullable en el resto.';

-- ========== estados: se conservan los actuales y se agregan los de emergencia ==========
alter table public.trabajos
  drop constraint if exists trabajos_estado_check;

alter table public.trabajos
  add constraint trabajos_estado_check
  check (
    estado in (
      'planificado',
      'en_curso',
      'completado',
      'mantencion_periodica',
      'pendiente',
      'en_proceso',
      'terminado'
    )
  );

comment on column public.trabajos.estado is
  'planificado|en_curso|completado|mantencion_periodica (trabajos) o pendiente|en_proceso|terminado (emergencias).';

-- ========== media: fotos y videos en una sola tabla ==========
alter table public.trabajo_fotos
  rename to trabajo_media;

alter table public.trabajo_media
  add column if not exists tipo_archivo text not null default 'foto';

alter table public.trabajo_media
  drop constraint if exists trabajo_fotos_tipo_check;

alter table public.trabajo_media
  drop constraint if exists trabajo_media_tipo_check;

alter table public.trabajo_media
  add constraint trabajo_media_tipo_check
  check (tipo in ('antes', 'despues'));

alter table public.trabajo_media
  drop constraint if exists trabajo_media_tipo_archivo_check;

alter table public.trabajo_media
  add constraint trabajo_media_tipo_archivo_check
  check (tipo_archivo in ('foto', 'video'));

comment on table public.trabajo_media is
  'Evidencia de un trabajo: foto o video, momento antes/despues. url = key R2.';

comment on column public.trabajo_media.url is
  'Key del objeto en R2 (ej. trabajos/{trabajo_id}/uuid.jpg), no URL completa.';

comment on column public.trabajo_media.tipo is
  'Momento de la evidencia: antes | despues.';

comment on column public.trabajo_media.tipo_archivo is
  'Naturaleza del archivo: foto | video.';

alter index if exists trabajo_fotos_trabajo_id_idx
  rename to trabajo_media_trabajo_id_idx;

create index if not exists trabajo_media_trabajo_momento_archivo_idx
  on public.trabajo_media (trabajo_id, tipo, tipo_archivo);

-- Políticas RLS conservan el OID de la tabla; solo se renombran para claridad.
alter policy "Roles can select trabajo_fotos"
  on public.trabajo_media
  rename to "Roles can select trabajo_media";

alter policy "Admin pablo asistente can insert trabajo_fotos"
  on public.trabajo_media
  rename to "Admin pablo asistente can insert trabajo_media";

alter policy "Admin pablo asistente can update trabajo_fotos"
  on public.trabajo_media
  rename to "Admin pablo asistente can update trabajo_media";

alter policy "Admin pablo can delete trabajo_fotos"
  on public.trabajo_media
  rename to "Admin pablo can delete trabajo_media";
