-- Fachadas (Imagen → Fachadas). Tablas NUEVAS: no altera trabajos, eventos
-- ni compras_materiales. No aplicar en prod desde este commit.

-- No existía una función genérica de updated_at en migraciones anteriores.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ========== rubros de proveedores ==========
create table public.proveedor_rubros (
  proveedor_id uuid not null references public.proveedores (id) on delete cascade,
  rubro text not null,
  primary key (proveedor_id, rubro),
  constraint proveedor_rubros_rubro_check
    check (
      rubro in (
        'limpieza',
        'reparacion',
        'pintura',
        'hojalateria',
        'materiales',
        'andamios',
        'albanileria',
        'otro'
      )
    )
);

comment on table public.proveedor_rubros is
  'Rubros de un proveedor del catálogo. El filtro de Fachadas incluye «mostrar todos».';

create index proveedor_rubros_rubro_idx
  on public.proveedor_rubros (rubro);

-- ========== catálogo de fachadas ==========
create table public.fachadas (
  id uuid primary key default gen_random_uuid(),
  recinto_id uuid references public.recintos (id) on delete set null,
  nombre text not null,
  alto_m numeric(12, 2) not null,
  ancho_m numeric(12, 2) not null,
  superficie_m2 numeric(12, 2) not null,
  foto_key text,
  foto_nombre text,
  plano_key text,
  plano_nombre text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.perfiles (id),
  constraint fachadas_alto_m_check check (alto_m > 0),
  constraint fachadas_ancho_m_check check (ancho_m > 0),
  constraint fachadas_superficie_m2_check check (superficie_m2 > 0),
  constraint fachadas_recinto_nombre_key unique (recinto_id, nombre)
);

comment on table public.fachadas is
  'Fachada (Imagen → Fachadas). recinto_id es opcional (fachada general del complejo).';

comment on column public.fachadas.recinto_id is
  'Recinto asociado. Null = fachada general. ON DELETE SET NULL.';

comment on column public.fachadas.alto_m is
  'Alto en metros. Obligatorio, > 0.';

comment on column public.fachadas.ancho_m is
  'Ancho en metros. Obligatorio, > 0.';

comment on column public.fachadas.superficie_m2 is
  'm² totales. Autocompletado alto×ancho en el formulario; el usuario puede '
  'editarlo (vanos, portones, formas irregulares).';

comment on column public.fachadas.foto_key is
  'Key R2 de la foto general: fachadas/{id}/general/…';

comment on column public.fachadas.plano_key is
  'Key R2 del plano (PDF o imagen): fachadas/{id}/plano/… Null = sin plano.';

create index fachadas_recinto_id_idx on public.fachadas (recinto_id);

create unique index fachadas_nombre_sin_recinto_key
  on public.fachadas (nombre)
  where recinto_id is null;

create trigger fachadas_set_updated_at
  before update on public.fachadas
  for each row
  execute function public.set_updated_at();

-- ========== intervenciones ==========
create table public.fachada_intervenciones (
  id uuid primary key default gen_random_uuid(),
  fachada_id uuid not null references public.fachadas (id) on delete cascade,
  estado text,
  fecha_inicio date,
  fecha_termino date,
  ejecutado_por text,
  proveedor_id uuid references public.proveedores (id) on delete restrict,
  requiere_hojalateria boolean not null default false,
  sin_materiales boolean not null default false,
  alto_m_snapshot numeric(12, 2) not null,
  ancho_m_snapshot numeric(12, 2) not null,
  superficie_m2_snapshot numeric(12, 2) not null,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.perfiles (id),
  constraint fachada_intervenciones_estado_check
    check (
      estado is null
      or estado in (
        'sin_empezar',
        'en_proceso',
        'ejecutado_pendiente_entrega',
        'entregado'
      )
    ),
  constraint fachada_intervenciones_ejecutado_por_check
    check (
      ejecutado_por is null
      or ejecutado_por in ('maestros_bodetek', 'proveedor_externo')
    ),
  constraint fachada_intervenciones_fechas_check
    check (
      fecha_inicio is null
      or fecha_termino is null
      or fecha_termino >= fecha_inicio
    ),
  constraint fachada_intervenciones_alto_snapshot_check
    check (alto_m_snapshot > 0),
  constraint fachada_intervenciones_ancho_snapshot_check
    check (ancho_m_snapshot > 0),
  constraint fachada_intervenciones_superficie_snapshot_check
    check (superficie_m2_snapshot > 0)
);

comment on table public.fachada_intervenciones is
  'Campaña de trabajo sobre una fachada. Los indicadores usan siempre el snapshot.';

comment on column public.fachada_intervenciones.estado is
  'Estados de filtración: sin_empezar | en_proceso | ejecutado_pendiente_entrega | entregado. Null en BD; la app mapea null ↔ "".';

comment on column public.fachada_intervenciones.sin_materiales is
  'Si true, Maestros Bodetek no usó materiales. Checkbox «Esta intervención no usó materiales».';

comment on column public.fachada_intervenciones.requiere_hojalateria is
  'Si true, la completitud de costos exige ≥1 fila en fachada_hojalateria con neto y proveedor.';

comment on column public.fachada_intervenciones.superficie_m2_snapshot is
  'm² copiados desde la fachada SOLO al crear la intervención. Editar la '
  'intervención no lo toca. Solo se refresca con la acción explícita '
  '«Actualizar medidas desde la fachada». Los indicadores no leen la medida viva.';

create index fachada_intervenciones_fachada_id_idx
  on public.fachada_intervenciones (fachada_id);

create index fachada_intervenciones_estado_idx
  on public.fachada_intervenciones (estado);

create trigger fachada_intervenciones_set_updated_at
  before update on public.fachada_intervenciones
  for each row
  execute function public.set_updated_at();

-- ========== tipos + días ==========
create table public.fachada_intervencion_tipos (
  intervencion_id uuid not null
    references public.fachada_intervenciones (id) on delete cascade,
  tipo text not null,
  dias numeric(8, 2) not null,
  primary key (intervencion_id, tipo),
  constraint fachada_intervencion_tipos_tipo_check
    check (tipo in ('limpieza', 'reparacion', 'pintura')),
  constraint fachada_intervencion_tipos_dias_check check (dias > 0)
);

comment on table public.fachada_intervencion_tipos is
  'Tipos de trabajo de una intervención y días invertidos. La suma por tipo es el indicador principal de días.';

-- ========== cotizaciones (proveedor externo) ==========
create table public.fachada_cotizaciones (
  id uuid primary key default gen_random_uuid(),
  intervencion_id uuid not null
    references public.fachada_intervenciones (id) on delete cascade,
  proveedor_id uuid references public.proveedores (id) on delete restrict,
  numero_cotizacion text,
  valor_neto integer not null check (valor_neto >= 0),
  valor_iva integer not null check (valor_iva >= 0),
  valor_bruto integer not null check (valor_bruto >= 0),
  cotizacion_key text,
  cotizacion_nombre text,
  factura_key text,
  factura_nombre text,
  created_at timestamptz not null default now(),
  created_by uuid references public.perfiles (id),
  constraint fachada_cotizaciones_bruto_check
    check (valor_bruto = valor_neto + valor_iva)
);

comment on table public.fachada_cotizaciones is
  'Cotización de una intervención (proveedor externo). Cotización y factura son PDFs separados.';

comment on column public.fachada_cotizaciones.cotizacion_key is
  'Key R2 del PDF de cotización. Completitud de costos exige ≥1 cotización con neto y este PDF.';

comment on column public.fachada_cotizaciones.factura_key is
  'Key R2 del PDF de factura (se puede adjuntar después). El indicador «M de N cotizaciones con factura» depende de esto.';

create index fachada_cotizaciones_intervencion_id_idx
  on public.fachada_cotizaciones (intervencion_id);

create table public.fachada_cotizacion_tipos (
  cotizacion_id uuid not null
    references public.fachada_cotizaciones (id) on delete cascade,
  tipo text not null,
  primary key (cotizacion_id, tipo),
  constraint fachada_cotizacion_tipos_tipo_check
    check (tipo in ('limpieza', 'reparacion', 'pintura'))
);

comment on table public.fachada_cotizacion_tipos is
  'Tipos que cubre una cotización. Distintas cotizaciones pueden cubrir tipos distintos.';

-- ========== hojalatería 0..N ==========
create table public.fachada_hojalateria (
  id uuid primary key default gen_random_uuid(),
  intervencion_id uuid not null
    references public.fachada_intervenciones (id) on delete cascade,
  proveedor_id uuid references public.proveedores (id) on delete restrict,
  descripcion text,
  cotizacion_key text,
  cotizacion_nombre text,
  factura_key text,
  factura_nombre text,
  valor_neto integer not null check (valor_neto >= 0),
  valor_iva integer not null check (valor_iva >= 0),
  valor_bruto integer not null check (valor_bruto >= 0),
  created_at timestamptz not null default now(),
  created_by uuid references public.perfiles (id),
  constraint fachada_hojalateria_bruto_check
    check (valor_bruto = valor_neto + valor_iva)
);

comment on table public.fachada_hojalateria is
  'Trabajos de hojalatería de una intervención (0..N). Reemplaza columnas hojalateria_* en la intervención.';

create index fachada_hojalateria_intervencion_id_idx
  on public.fachada_hojalateria (intervencion_id);

-- ========== materiales (Maestros Bodetek) ==========
create table public.fachada_materiales (
  id uuid primary key default gen_random_uuid(),
  intervencion_id uuid not null
    references public.fachada_intervenciones (id) on delete cascade,
  fecha_compra date,
  proveedor_id uuid references public.proveedores (id) on delete restrict,
  numero_factura text,
  material text not null,
  valor_neto integer not null check (valor_neto >= 0),
  valor_iva integer not null check (valor_iva >= 0),
  valor_bruto integer not null check (valor_bruto >= 0),
  factura_key text,
  factura_nombre text,
  created_at timestamptz not null default now(),
  created_by uuid references public.perfiles (id),
  constraint fachada_materiales_bruto_check
    check (valor_bruto = valor_neto + valor_iva)
);

comment on table public.fachada_materiales is
  'Materiales de una intervención ejecutada por Maestros Bodetek. proveedor_id del catálogo (rubro materiales + mostrar todos).';

create index fachada_materiales_intervencion_id_idx
  on public.fachada_materiales (intervencion_id);

-- ========== media antes/después ==========
create table public.fachada_media (
  id uuid primary key default gen_random_uuid(),
  intervencion_id uuid not null
    references public.fachada_intervenciones (id) on delete cascade,
  tipo text not null,
  tipo_archivo text not null,
  object_key text not null,
  nombre_archivo text,
  thumbnail_key text,
  created_at timestamptz not null default now(),
  created_by uuid references public.perfiles (id),
  constraint fachada_media_tipo_check check (tipo in ('antes', 'despues')),
  constraint fachada_media_tipo_archivo_check
    check (tipo_archivo in ('foto', 'video'))
);

comment on table public.fachada_media is
  'Fotos/videos antes|después. Prefijo R2 fachadas/{fachadaId}/intervenciones/{id}/fotos/…';

create index fachada_media_intervencion_id_idx
  on public.fachada_media (intervencion_id);

-- ========== RLS (igual que eventos) ==========
do $$
declare
  t text;
  tablas text[] := array[
    'proveedor_rubros',
    'fachadas',
    'fachada_intervenciones',
    'fachada_intervencion_tipos',
    'fachada_cotizaciones',
    'fachada_cotizacion_tipos',
    'fachada_hojalateria',
    'fachada_materiales',
    'fachada_media'
  ];
begin
  foreach t in array tablas loop
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
  end loop;
end $$;
