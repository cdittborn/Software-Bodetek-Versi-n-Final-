-- Revisiones y mantenciones periódicas (Techos) + documentos/planos por recinto.

-- ========== catálogo ==========
insert into public.trabajo_subtipos (categoria_id, nombre)
select c.id, 'Revisiones y mantenciones periódicas'
from public.trabajo_categorias as c
where c.nombre = 'Techumbres y canales'
on conflict (categoria_id, nombre) do nothing;

-- ========== techos: columnas en trabajos ==========
alter table public.trabajos
  add column if not exists materiales text;

alter table public.trabajos
  add column if not exists fecha_ultima_revision date;

comment on column public.trabajos.materiales is
  'Materiales del techo. Usado en Revisiones y mantenciones periódicas.';
comment on column public.trabajos.fecha_ultima_revision is
  'Última revisión del techo. proxima_mantencion = esta fecha + periodicidad_dias (cálculo en la app).';

-- ========== media: cotización ==========
alter table public.trabajo_media
  drop constraint if exists trabajo_media_tipo_check;

alter table public.trabajo_media
  add constraint trabajo_media_tipo_check
  check (
    (trabajo_id is null or tipo is not null)
    and (
      tipo is null
      or tipo in (
        'antes',
        'despues',
        'adjunto',
        'patente_provisoria',
        'cotizacion'
      )
    )
  );

comment on column public.trabajo_media.tipo is
  'antes | despues (Lluvias); adjunto | patente_provisoria (Patentes); adjunto | cotizacion (Techos); null solo en cajón inbox.';

-- ========== acciones: estado de 3 valores (Patentes sigue usando hecha) ==========
alter table public.trabajo_acciones
  add column if not exists estado text;

update public.trabajo_acciones
set estado = case when hecha then 'terminada' else 'pendiente' end
where estado is null;

alter table public.trabajo_acciones
  alter column estado set default 'pendiente';

alter table public.trabajo_acciones
  alter column estado set not null;

alter table public.trabajo_acciones
  drop constraint if exists trabajo_acciones_estado_check;

alter table public.trabajo_acciones
  add constraint trabajo_acciones_estado_check
  check (estado in ('pendiente', 'en_proceso', 'terminada'));

create or replace function public.sincronizar_trabajo_accion_estado()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.hecha and new.estado is distinct from 'terminada' then
      new.estado := 'terminada';
    elsif new.estado = 'terminada' then
      new.hecha := true;
    else
      new.hecha := false;
    end if;
    return new;
  end if;

  if new.estado is distinct from old.estado then
    new.hecha := (new.estado = 'terminada');
  elsif new.hecha is distinct from old.hecha then
    new.estado := case when new.hecha then 'terminada' else 'pendiente' end;
  end if;
  return new;
end;
$$;

drop trigger if exists trabajo_acciones_sync_estado on public.trabajo_acciones;
create trigger trabajo_acciones_sync_estado
  before insert or update on public.trabajo_acciones
  for each row
  execute function public.sincronizar_trabajo_accion_estado();

-- ========== recinto documentos y planos ==========
create table public.recinto_documentos (
  id uuid primary key default gen_random_uuid(),
  recinto_id uuid not null references public.recintos (id) on delete cascade,
  tipo text not null check (tipo in ('contrato_arriendo', 'otro')),
  nombre_archivo text,
  url text not null,
  fecha_vencimiento date,
  created_at timestamptz not null default now()
);

comment on table public.recinto_documentos is
  'Contratos de arriendo y otros documentos del recinto. url = key R2.';

create index recinto_documentos_recinto_id_idx
  on public.recinto_documentos (recinto_id, created_at);

create table public.recinto_planos (
  id uuid primary key default gen_random_uuid(),
  recinto_id uuid not null references public.recintos (id) on delete cascade,
  nombre_archivo text,
  url text not null,
  created_at timestamptz not null default now()
);

comment on table public.recinto_planos is
  'Planos propios de un recinto (no el plano del complejo). url = key R2.';

create index recinto_planos_recinto_id_idx
  on public.recinto_planos (recinto_id, created_at);

alter table public.recinto_documentos enable row level security;
alter table public.recinto_planos enable row level security;

-- Módulo recintos: ven admin/pablo/asistente; escriben admin/pablo.
create policy "Roles can select recinto_documentos"
  on public.recinto_documentos for select
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo can insert recinto_documentos"
  on public.recinto_documentos for insert
  to authenticated
  with check (public.mi_rol() in ('admin', 'pablo'));

create policy "Admin pablo can update recinto_documentos"
  on public.recinto_documentos for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'))
  with check (public.mi_rol() in ('admin', 'pablo'));

create policy "Admin pablo can delete recinto_documentos"
  on public.recinto_documentos for delete
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));

create policy "Roles can select recinto_planos"
  on public.recinto_planos for select
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo can insert recinto_planos"
  on public.recinto_planos for insert
  to authenticated
  with check (public.mi_rol() in ('admin', 'pablo'));

create policy "Admin pablo can update recinto_planos"
  on public.recinto_planos for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'))
  with check (public.mi_rol() in ('admin', 'pablo'));

create policy "Admin pablo can delete recinto_planos"
  on public.recinto_planos for delete
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));

grant select, insert, update, delete on table public.recinto_documentos to authenticated;
grant all on table public.recinto_documentos to service_role;
grant select, insert, update, delete on table public.recinto_planos to authenticated;
grant all on table public.recinto_planos to service_role;
