-- Lluvias y temporales: eventos, gravedad, cajón de media sin asignar.

-- ========== eventos ==========
create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  subtipo_id uuid not null references public.trabajo_subtipos (id) on delete restrict,
  nombre text not null,
  fecha date not null,
  created_at timestamptz not null default now(),
  unique (subtipo_id, nombre)
);

comment on table public.eventos is
  'Agrupación de filtración-proyectos (ej. Lluvias agosto 2026).';

create index eventos_subtipo_id_idx on public.eventos (subtipo_id);

alter table public.eventos enable row level security;

create policy "Roles can select eventos"
  on public.eventos for select
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente'));

create policy "Admin pablo asistente can insert eventos"
  on public.eventos for insert
  to authenticated
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo asistente can update eventos"
  on public.eventos for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente'))
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo can delete eventos"
  on public.eventos for delete
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));

grant select, insert, update, delete on table public.eventos to authenticated;
grant all on table public.eventos to service_role;

-- ========== trabajos: evento + gravedad ==========
alter table public.trabajos
  add column if not exists evento_id uuid references public.eventos (id) on delete restrict;

alter table public.trabajos
  add column if not exists gravedad text;

alter table public.trabajos
  drop constraint if exists trabajos_gravedad_check;

alter table public.trabajos
  add constraint trabajos_gravedad_check
  check (gravedad is null or gravedad in ('alta', 'media', 'baja'));

comment on column public.trabajos.evento_id is
  'Evento (temporal) al que pertenece un filtración-proyecto. Null en el resto de trabajos.';
comment on column public.trabajos.gravedad is
  'alta | media | baja. Null fuera de Lluvias y temporales.';

create index if not exists trabajos_evento_id_idx on public.trabajos (evento_id);

drop index if exists trabajos_evento_recinto_key;
create unique index trabajos_evento_recinto_key
  on public.trabajos (evento_id, recinto_id)
  where evento_id is not null;

-- ========== trabajo_media: cajón (trabajo_id / tipo nullable) ==========
alter table public.trabajo_media
  alter column trabajo_id drop not null;

alter table public.trabajo_media
  alter column tipo drop not null;

alter table public.trabajo_media
  drop constraint if exists trabajo_media_tipo_check;

-- Postgres CHECK trata NULL como válido; hay que exigir tipo cuando hay trabajo.
alter table public.trabajo_media
  add constraint trabajo_media_tipo_check
  check (
    (trabajo_id is null or tipo is not null)
    and (tipo is null or tipo in ('antes', 'despues'))
  );

comment on column public.trabajo_media.trabajo_id is
  'Null = cajón sin identificar (inbox/). Al asignar: UPDATE trabajo_id + tipo.';
comment on column public.trabajo_media.tipo is
  'antes | despues en un proyecto. Null solo en el cajón.';

create index if not exists trabajo_media_inbox_idx
  on public.trabajo_media (created_at desc)
  where trabajo_id is null;

-- ========== RLS trabajo_media ==========
drop policy if exists "Roles can select trabajo_media" on public.trabajo_media;
drop policy if exists "Admin pablo asistente can insert trabajo_media" on public.trabajo_media;
drop policy if exists "Admin pablo asistente can update trabajo_media" on public.trabajo_media;
drop policy if exists "Admin pablo can delete trabajo_media" on public.trabajo_media;

create policy "Roles can select trabajo_media"
  on public.trabajo_media for select
  to authenticated
  using (
    (
      trabajo_id is not null
      and public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente')
    )
    or (
      trabajo_id is null
      and public.mi_rol() in ('admin', 'pablo', 'asistente')
    )
  );

create policy "Roles can insert trabajo_media"
  on public.trabajo_media for insert
  to authenticated
  with check (
    (
      trabajo_id is not null
      and public.mi_rol() in ('admin', 'pablo', 'asistente')
    )
    or (
      trabajo_id is null
      and public.mi_rol() in ('admin', 'pablo')
    )
  );

create policy "Admin pablo asistente can update trabajo_media"
  on public.trabajo_media for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente'))
  with check (
    (
      trabajo_id is not null
      and public.mi_rol() in ('admin', 'pablo', 'asistente')
    )
    or (
      trabajo_id is null
      and public.mi_rol() in ('admin', 'pablo')
    )
  );

create policy "Admin pablo can delete trabajo_media"
  on public.trabajo_media for delete
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));
