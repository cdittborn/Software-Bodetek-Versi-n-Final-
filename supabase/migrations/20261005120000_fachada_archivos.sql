-- Galería de fotos y videos del estado actual de una fachada.
-- fachadas.foto_key se conserva (en desuso): no se borra.
-- No aplicar en producción sin OK explícito.

create table public.fachada_archivos (
  id uuid primary key default gen_random_uuid(),
  fachada_id uuid not null references public.fachadas (id) on delete cascade,
  tipo_archivo text not null,
  object_key text not null,
  thumbnail_key text,
  nombre_archivo text,
  es_portada boolean not null default false,
  orden integer not null default 0,
  fecha date,
  created_at timestamptz not null default now(),
  created_by uuid references public.perfiles (id),
  constraint fachada_archivos_tipo_archivo_check
    check (tipo_archivo in ('foto', 'video')),
  constraint fachada_archivos_portada_foto_check
    check (es_portada = false or tipo_archivo = 'foto')
);

comment on table public.fachada_archivos is
  'Fotos y videos del estado actual. Prefijo R2 fachadas/{fachadaId}/general/…';

comment on column public.fachada_archivos.es_portada is
  'Máximo una portada por fachada, y solo si es foto (índice único parcial).';

comment on column public.fachada_archivos.orden is
  'Orden en la galería de la ficha.';

comment on column public.fachadas.foto_key is
  'En desuso. La galería vive en fachada_archivos. Se conserva la key histórica.';

create index fachada_archivos_fachada_id_idx
  on public.fachada_archivos (fachada_id);

create unique index fachada_archivos_portada_unica
  on public.fachada_archivos (fachada_id)
  where es_portada;

insert into public.fachada_archivos (
  fachada_id,
  tipo_archivo,
  object_key,
  nombre_archivo,
  es_portada,
  orden,
  fecha,
  created_at,
  created_by
)
select
  f.id,
  'foto',
  f.foto_key,
  f.foto_nombre,
  true,
  0,
  (f.updated_at at time zone 'utc')::date,
  f.updated_at,
  f.created_by
from public.fachadas f
where f.foto_key is not null
  and btrim(f.foto_key) <> ''
  and not exists (
    select 1
    from public.fachada_archivos a
    where a.fachada_id = f.id
      and a.object_key = f.foto_key
  );

do $$
declare
  t text := 'fachada_archivos';
begin
  execute format('alter table public.%I enable row level security', t);

  execute format(
    'create policy %I on public.%I for select to authenticated
     using (public.mi_rol() in (''admin'', ''pablo'', ''asistente'', ''socio'', ''cliente''))',
    'Roles can select ' || t,
    t
  );

  execute format(
    'create policy %I on public.%I for insert to authenticated
     with check (public.mi_rol() in (''admin'', ''pablo'', ''asistente''))',
    'Admin pablo asistente can insert ' || t,
    t
  );

  execute format(
    'create policy %I on public.%I for update to authenticated
     using (public.mi_rol() in (''admin'', ''pablo'', ''asistente''))
     with check (public.mi_rol() in (''admin'', ''pablo'', ''asistente''))',
    'Admin pablo asistente can update ' || t,
    t
  );

  execute format(
    'create policy %I on public.%I for delete to authenticated
     using (public.mi_rol() in (''admin'', ''pablo''))',
    'Admin pablo can delete ' || t,
    t
  );

  execute format(
    'grant select, insert, update, delete on table public.%I to authenticated',
    t
  );
  execute format(
    'grant all on table public.%I to service_role',
    t
  );
end $$;
