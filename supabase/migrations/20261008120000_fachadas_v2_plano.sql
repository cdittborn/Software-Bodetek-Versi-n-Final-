-- Fachadas v2: plano, vínculos N:M y reporte para socios.
-- Aditiva. No borra filas, archivos ni intervenciones.
-- No aplicar en producción sin OK explícito.
--
-- Supuestos mientras el gerente no responda (DECISIONES parte 2):
--   temporada julio–junio (no hay columna; MES_INICIO_TEMPORADA = 7 en el seed);
--   alto_m y superficie_m2 se dejan null en el seed;
--   el link de socios no vence: token_expira queda null y se apaga con token_activo;
--   cinco espacios comunes entran como recintos area_comun.
--   Acceso y Cierre Huasco no son recintos.

-- ========== fachadas: columnas del plano ==========
alter table public.fachadas
  add column svg_id text,
  add column ubicacion text,
  add column tipo_espacio text,
  add column unidad_label text,
  add column orden integer,
  add column largo_plano_m numeric(12, 2),
  add column evaluada_en date;

alter table public.fachadas
  add constraint fachadas_svg_id_key unique (svg_id);

alter table public.fachadas
  add constraint fachadas_ubicacion_check
  check (ubicacion is null or ubicacion in ('interior', 'exterior'));

alter table public.fachadas
  add constraint fachadas_tipo_espacio_check
  check (
    tipo_espacio is null
    or tipo_espacio in ('unidad', 'compartida', 'espacio_comun', 'perimetro')
  );

alter table public.fachadas
  add constraint fachadas_orden_check
  check (orden is null or orden > 0);

alter table public.fachadas
  add constraint fachadas_largo_plano_m_check
  check (largo_plano_m is null or largo_plano_m > 0);

comment on column public.fachadas.svg_id is
  'Id estable del plano v2 (fachadas-v2.json). Null solo antes del seed.';

comment on column public.fachadas.ubicacion is
  'interior o exterior, según el plano. No es el estado de la fachada.';

comment on column public.fachadas.tipo_espacio is
  'unidad, compartida, espacio_comun o perimetro.';

comment on column public.fachadas.unidad_label is
  'Rótulo del plano (puede agrupar varias unidades).';

comment on column public.fachadas.orden is
  'Orden de la fachada dentro de unidad_label.';

comment on column public.fachadas.largo_plano_m is
  'Largo del muro en el plano (largo_m_aprox). No es la superficie.';

comment on column public.fachadas.evaluada_en is
  'Fecha en que se marcó evaluada. Null y sin intervenciones = sin evaluar. El estado no se guarda.';

comment on column public.fachadas.recinto_id is
  'Primera unidad del plano, por compatibilidad. El resto vive en fachada_recintos. Null en Acceso y Cierre Huasco.';

-- ========== N:M fachada ↔ recinto ==========
create table public.fachada_recintos (
  fachada_id uuid not null references public.fachadas (id) on delete cascade,
  recinto_id uuid not null references public.recintos (id) on delete cascade,
  primary key (fachada_id, recinto_id)
);

comment on table public.fachada_recintos is
  'Unidades que comparten el muro. fachadas.recinto_id queda la primera, por compatibilidad.';

create index fachada_recintos_recinto_id_idx
  on public.fachada_recintos (recinto_id);

-- ========== galería: antes / después ==========
alter table public.fachada_archivos
  add column momento text not null default 'antes',
  add column duracion_seg integer;

alter table public.fachada_archivos
  add constraint fachada_archivos_momento_check
  check (momento in ('antes', 'despues'));

alter table public.fachada_archivos
  add constraint fachada_archivos_duracion_seg_check
  check (duracion_seg is null or duracion_seg >= 0);

comment on column public.fachada_archivos.momento is
  'antes o despues de la fachada, no de una intervención. Las filas ya cargadas quedan en antes.';

comment on column public.fachada_archivos.duracion_seg is
  'Duración del video, en segundos. Null en las fotos.';

comment on column public.fachada_archivos.es_portada is
  'Máximo una portada por fachada y momento, y solo si es foto.';

drop index if exists public.fachada_archivos_portada_unica;

create unique index fachada_archivos_portada_unica
  on public.fachada_archivos (fachada_id, momento)
  where es_portada;

-- ========== reporte público (snapshot, sin vencimiento) ==========
create table public.fachadas_reportes (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  token_activo boolean not null default false,
  token_expira date,
  created_by uuid references public.perfiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fachadas_reportes_token_largo check (char_length(token) >= 32)
);

comment on table public.fachadas_reportes is
  'Link público del reporte de fachadas. El contenido visible está en fachadas_reporte_versiones. No se siembra token en esta fase.';

comment on column public.fachadas_reportes.token_expira is
  'Null a propósito: el link no vence y se apaga con token_activo. Supuesto hasta que el gerente responda.';

create trigger fachadas_reportes_set_updated_at
  before update on public.fachadas_reportes
  for each row
  execute function public.set_updated_at();

create table public.fachadas_reporte_versiones (
  id uuid primary key default gen_random_uuid(),
  reporte_id uuid not null references public.fachadas_reportes (id) on delete cascade,
  numero integer not null,
  publicado_at timestamptz not null default now(),
  publicado_por uuid references public.perfiles (id),
  contenido jsonb not null,
  unique (reporte_id, numero),
  constraint fachadas_reporte_versiones_numero_check check (numero > 0)
);

comment on table public.fachadas_reporte_versiones is
  'Registro inmutable de lo publicado a los socios. Se inserta una fila por publicación; no se actualiza.';

comment on column public.fachadas_reporte_versiones.contenido is
  'Snapshot de agregados. Sin arrendatarios, documentos, proveedores ni montos por contrato.';

create index fachadas_reporte_versiones_reporte_idx
  on public.fachadas_reporte_versiones (reporte_id, numero desc);

-- ========== espacios comunes ==========
insert into public.recintos (sitio, galpon, codigo, nombre, tipo)
values
  ('1', '', 'TALLER MAESTROS', 'Taller de maestros', 'area_comun'),
  ('1', '', 'BANOS COMUNES', 'Baños comunes', 'area_comun'),
  ('1', '', 'COMEDOR', 'Comedor', 'area_comun'),
  ('2', '', 'BODEGA MAESTROS', 'Bodega de maestros', 'area_comun'),
  ('2', '', 'OFICINA ADMINISTRACION', 'Oficina administración', 'area_comun')
on conflict on constraint recintos_sitio_galpon_codigo_key do nothing;

-- ========== RLS ==========
-- Mismos roles que fachada_archivos, y revoke previo como en informes_seguro
-- para que el default ALL de authenticated no deje el UPDATE de las versiones.
do $$
declare
  t text;
begin
  foreach t in array array[
    'fachada_recintos',
    'fachadas_reportes',
    'fachadas_reporte_versiones'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'revoke all on table public.%I from public, anon, authenticated',
      t
    );

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

    if t <> 'fachadas_reporte_versiones' then
      execute format(
        'create policy %I on public.%I for update to authenticated
         using (public.mi_rol() in (''admin'', ''pablo'', ''asistente''))
         with check (public.mi_rol() in (''admin'', ''pablo'', ''asistente''))',
        'Admin pablo asistente can update ' || t,
        t
      );
    end if;

    execute format(
      'create policy %I on public.%I for delete to authenticated
       using (public.mi_rol() in (''admin'', ''pablo''))',
      'Admin pablo can delete ' || t,
      t
    );

    if t = 'fachadas_reporte_versiones' then
      execute format(
        'grant select, insert, delete on table public.%I to authenticated',
        t
      );
    else
      execute format(
        'grant select, insert, update, delete on table public.%I to authenticated',
        t
      );
    end if;

    execute format('grant all on table public.%I to service_role', t);
  end loop;
end $$;
