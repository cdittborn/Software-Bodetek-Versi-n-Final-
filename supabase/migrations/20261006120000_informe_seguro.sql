-- Informe para seguro (Lluvias y temporales).
-- Solo el borrador y las versiones publicadas. No crea cotizaciones
-- y no modifica trabajos, problemas ni el Dashboard 4a.
-- No aplicar en producción sin OK explícito.

create table public.informes_seguro (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null unique references public.eventos (id) on delete cascade,
  nombre text not null default '',
  nombre_evento text not null default '',
  fecha_evento date,
  direccion_centro text not null default '',
  numero_siniestro text,
  numero_poliza text,
  contacto_bodetek text not null default '',
  fecha_emision date,
  token text not null unique,
  token_activo boolean not null default false,
  token_expira date,
  created_by uuid references public.perfiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint informes_seguro_token_largo check (char_length(token) >= 32)
);

comment on table public.informes_seguro is
  'Borrador del informe para el seguro, uno por evento. El link público no lee esta fila salvo el token: el contenido visible está en informe_seguro_versiones.';

comment on column public.informes_seguro.token is
  'Secreto del link /informe-seguro/[token]. Inactivo hasta publicar.';

create table public.informe_seguro_recintos (
  informe_id uuid not null references public.informes_seguro (id) on delete cascade,
  trabajo_id uuid not null references public.trabajos (id) on delete cascade,
  incluido boolean not null default true,
  descripcion_seguro text not null default '',
  primary key (informe_id, trabajo_id)
);

comment on column public.informe_seguro_recintos.descripcion_seguro is
  'Texto para el seguro. Independiente de trabajos.descripcion y de problemas.descripcion.';

create table public.informe_seguro_subproyectos (
  informe_id uuid not null references public.informes_seguro (id) on delete cascade,
  trabajo_id uuid not null references public.trabajos (id) on delete cascade,
  tipo_problema text not null,
  incluido boolean not null default true,
  descripcion_seguro text not null default '',
  primary key (informe_id, trabajo_id, tipo_problema),
  constraint informe_seguro_subproyectos_tipo_check check (
    tipo_problema in ('techumbre', 'cielo', 'electrico', 'suciedad_piso')
  )
);

create table public.informe_seguro_media (
  informe_id uuid not null references public.informes_seguro (id) on delete cascade,
  trabajo_media_id uuid not null references public.trabajo_media (id) on delete cascade,
  trabajo_id uuid not null references public.trabajos (id) on delete cascade,
  tipo_problema text,
  incluido boolean not null default true,
  orden integer not null default 0,
  es_portada boolean not null default false,
  primary key (informe_id, trabajo_media_id),
  constraint informe_seguro_media_tipo_check check (
    tipo_problema is null
    or tipo_problema in ('techumbre', 'cielo', 'electrico', 'suciedad_piso')
  )
);

create unique index informe_seguro_media_portada_sub_idx
  on public.informe_seguro_media (informe_id, trabajo_id, tipo_problema)
  where es_portada and tipo_problema is not null;

create unique index informe_seguro_media_portada_recinto_idx
  on public.informe_seguro_media (informe_id, trabajo_id)
  where es_portada and tipo_problema is null;

create table public.informe_seguro_versiones (
  id uuid primary key default gen_random_uuid(),
  informe_id uuid not null references public.informes_seguro (id) on delete cascade,
  numero integer not null,
  publicado_at timestamptz not null default now(),
  publicado_por uuid references public.perfiles (id),
  contenido jsonb not null,
  unique (informe_id, numero),
  constraint informe_seguro_versiones_numero_check check (numero > 0)
);

comment on column public.informe_seguro_versiones.contenido is
  'Copia congelada que lee el link público. La clave cotizaciones queda reservada y hoy va vacía. No incluye notas internas ni URLs públicas.';

create index informe_seguro_versiones_informe_idx
  on public.informe_seguro_versiones (informe_id, numero desc);

-- El proyecto del borrador tiene que ser del mismo evento que el informe.
create or replace function public.informe_seguro_mismo_evento()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  ev uuid;
  tev uuid;
begin
  select evento_id into ev
  from public.informes_seguro
  where id = new.informe_id;

  select evento_id into tev
  from public.trabajos
  where id = new.trabajo_id;

  if ev is null or tev is distinct from ev then
    raise exception 'El proyecto no pertenece al evento del informe';
  end if;
  return new;
end;
$$;

create trigger informe_seguro_recintos_mismo_evento
  before insert or update on public.informe_seguro_recintos
  for each row
  execute function public.informe_seguro_mismo_evento();

create trigger informe_seguro_subproyectos_mismo_evento
  before insert or update on public.informe_seguro_subproyectos
  for each row
  execute function public.informe_seguro_mismo_evento();

create or replace function public.informe_seguro_media_valida()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  ev uuid;
  tev uuid;
  mid uuid;
  archivo text;
begin
  select evento_id into ev
  from public.informes_seguro
  where id = new.informe_id;

  select evento_id into tev
  from public.trabajos
  where id = new.trabajo_id;

  if ev is null or tev is distinct from ev then
    raise exception 'El proyecto no pertenece al evento del informe';
  end if;

  select trabajo_id, tipo_archivo into mid, archivo
  from public.trabajo_media
  where id = new.trabajo_media_id;

  if mid is distinct from new.trabajo_id then
    raise exception 'El archivo no pertenece al proyecto del informe';
  end if;

  if new.es_portada and archivo is distinct from 'foto' then
    raise exception 'La portada tiene que ser una foto';
  end if;

  return new;
end;
$$;

create trigger informe_seguro_media_valida
  before insert or update on public.informe_seguro_media
  for each row
  execute function public.informe_seguro_media_valida();

do $$
declare
  t text;
begin
  foreach t in array array[
    'informes_seguro',
    'informe_seguro_recintos',
    'informe_seguro_subproyectos',
    'informe_seguro_media',
    'informe_seguro_versiones'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public, anon', t);

    execute format(
      'create policy %I on public.%I for select to authenticated
       using (public.mi_rol() in (''admin'', ''pablo''))',
      t || '_select_admin_pablo',
      t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated
       with check (public.mi_rol() in (''admin'', ''pablo''))',
      t || '_insert_admin_pablo',
      t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated
       using (public.mi_rol() in (''admin'', ''pablo''))
       with check (public.mi_rol() in (''admin'', ''pablo''))',
      t || '_update_admin_pablo',
      t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated
       using (public.mi_rol() in (''admin'', ''pablo''))',
      t || '_delete_admin_pablo',
      t
    );

    execute format(
      'grant select, insert, update, delete on table public.%I to authenticated',
      t
    );
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end $$;
