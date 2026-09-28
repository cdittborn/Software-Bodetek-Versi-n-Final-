-- Rediseño Fachadas (fase 1). Aditivo sobre 20260924120000_fachadas.
-- No altera eventos ni trabajos. No borrar fachada_cotizaciones ni
-- fachada_cotizacion_tipos (quedan sin uso; se eliminan en un PR posterior).
-- No aplicar en prod desde este commit: esperar OK explícito.

-- ========== fachadas: frecuencia y letra ==========
alter table public.fachadas
  add column frecuencia_revision_meses integer not null default 12;

alter table public.fachadas
  add constraint fachadas_frecuencia_revision_meses_check
  check (frecuencia_revision_meses in (6, 12, 24));

alter table public.fachadas
  add column letra text;

comment on column public.fachadas.frecuencia_revision_meses is
  'Cada cuántos meses se revisa la fachada (6, 12 o 24). Default 12.';

comment on column public.fachadas.letra is
  'Etiqueta corta A, B, C… para el mapa (B14·A = código recinto + letra). '
  'Null si aún no se asignó. El formulario la pide junto con el nombre.';

comment on column public.fachadas.foto_key is
  'Key R2 de la foto del estado inicial: fachadas/{id}/general/…';

comment on column public.fachadas.recinto_id is
  'Recinto asociado. Sigue nullable en BD (fachadas generales legacy). '
  'El formulario lo exige.';

-- ========== intervenciones: estados propios + maestros ==========
alter table public.fachada_intervenciones
  drop constraint fachada_intervenciones_estado_check;

update public.fachada_intervenciones
set estado = case
  when estado is null or estado = '' or estado = 'sin_empezar' then 'programada'
  when estado in ('en_proceso', 'ejecutado_pendiente_entrega') then 'en_ejecucion'
  when estado = 'entregado' then 'terminada'
  when estado in ('programada', 'en_ejecucion', 'terminada') then estado
  else 'programada'
end;

alter table public.fachada_intervenciones
  alter column estado set default 'programada';

alter table public.fachada_intervenciones
  alter column estado set not null;

alter table public.fachada_intervenciones
  add constraint fachada_intervenciones_estado_check
  check (estado in ('programada', 'en_ejecucion', 'terminada'));

alter table public.fachada_intervenciones
  add column maestros_asignados text;

comment on column public.fachada_intervenciones.estado is
  'programada | en_ejecucion | terminada. Default programada. '
  'Ya no usa los estados de filtración ni el mapeo null ↔ "".';

comment on column public.fachada_intervenciones.maestros_asignados is
  'Nombres de maestros Bodetek cuando ejecutado_por = maestros_bodetek.';

-- ========== materiales: tipo pintura | otros ==========
alter table public.fachada_materiales
  add column tipo text not null default 'otros';

alter table public.fachada_materiales
  add constraint fachada_materiales_tipo_check
  check (tipo in ('pintura', 'otros'));

comment on column public.fachada_materiales.tipo is
  'pintura | otros. El detalle libre sigue en material.';

comment on column public.fachada_materiales.factura_key is
  'DEPRECADO: las facturas/boletas viven en fachada_documentos (categoría materiales). '
  'No borrar en esta migración.';

comment on column public.fachada_materiales.numero_factura is
  'DEPRECADO: el número va en fachada_documentos.numero.';

-- ========== documentos (cotización / factura / boleta) ==========
create table public.fachada_documentos (
  id uuid primary key default gen_random_uuid(),
  intervencion_id uuid not null
    references public.fachada_intervenciones (id) on delete cascade,
  tipo_documento text not null,
  categoria text not null,
  proveedor_id uuid references public.proveedores (id) on delete restrict,
  numero text,
  fecha date,
  valor_neto integer not null default 0,
  archivo_key text,
  archivo_nombre text,
  estado text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.perfiles (id),
  constraint fachada_documentos_tipo_check
    check (tipo_documento in ('cotizacion', 'factura', 'boleta')),
  constraint fachada_documentos_categoria_check
    check (categoria in ('mano_de_obra', 'materiales', 'hojalateria')),
  constraint fachada_documentos_valor_neto_check
    check (valor_neto >= 0),
  constraint fachada_documentos_estado_combo_check
    check (
      (
        tipo_documento = 'cotizacion'
        and estado in ('pendiente', 'aprobada', 'rechazada')
      )
      or (
        tipo_documento in ('factura', 'boleta')
        and estado in ('pendiente', 'pagada')
      )
    )
);

comment on table public.fachada_documentos is
  'Cotizaciones, facturas y boletas de una intervención. Montos siempre netos. '
  'Una factura/boleta de materiales puede cubrir varias filas de fachada_materiales.';

create index fachada_documentos_intervencion_id_idx
  on public.fachada_documentos (intervencion_id);

create index fachada_documentos_categoria_idx
  on public.fachada_documentos (categoria);

create trigger fachada_documentos_set_updated_at
  before update on public.fachada_documentos
  for each row
  execute function public.set_updated_at();

-- Cotizaciones de mano de obra (aprobadas).
insert into public.fachada_documentos (
  intervencion_id,
  tipo_documento,
  categoria,
  proveedor_id,
  numero,
  fecha,
  valor_neto,
  archivo_key,
  archivo_nombre,
  estado,
  created_at,
  created_by
)
select
  c.intervencion_id,
  'cotizacion',
  'mano_de_obra',
  c.proveedor_id,
  c.numero_cotizacion,
  (c.created_at at time zone 'utc')::date,
  c.valor_neto,
  c.cotizacion_key,
  c.cotizacion_nombre,
  'aprobada',
  c.created_at,
  c.created_by
from public.fachada_cotizaciones c;

-- Factura asociada a la cotización de mano de obra, si había PDF.
insert into public.fachada_documentos (
  intervencion_id,
  tipo_documento,
  categoria,
  proveedor_id,
  numero,
  fecha,
  valor_neto,
  archivo_key,
  archivo_nombre,
  estado,
  created_at,
  created_by
)
select
  c.intervencion_id,
  'factura',
  'mano_de_obra',
  c.proveedor_id,
  c.numero_cotizacion,
  (c.created_at at time zone 'utc')::date,
  c.valor_neto,
  c.factura_key,
  c.factura_nombre,
  'pendiente',
  c.created_at,
  c.created_by
from public.fachada_cotizaciones c
where c.factura_key is not null
  and btrim(c.factura_key) <> '';

-- Hojalatería: cotización.
insert into public.fachada_documentos (
  intervencion_id,
  tipo_documento,
  categoria,
  proveedor_id,
  numero,
  fecha,
  valor_neto,
  archivo_key,
  archivo_nombre,
  estado,
  created_at,
  created_by
)
select
  h.intervencion_id,
  'cotizacion',
  'hojalateria',
  h.proveedor_id,
  null,
  (h.created_at at time zone 'utc')::date,
  h.valor_neto,
  h.cotizacion_key,
  h.cotizacion_nombre,
  'aprobada',
  h.created_at,
  h.created_by
from public.fachada_hojalateria h
where h.cotizacion_key is not null
  and btrim(h.cotizacion_key) <> '';

-- Hojalatería sin PDF de cotización: igual se registra el neto como cotización aprobada.
insert into public.fachada_documentos (
  intervencion_id,
  tipo_documento,
  categoria,
  proveedor_id,
  numero,
  fecha,
  valor_neto,
  archivo_key,
  archivo_nombre,
  estado,
  created_at,
  created_by
)
select
  h.intervencion_id,
  'cotizacion',
  'hojalateria',
  h.proveedor_id,
  null,
  (h.created_at at time zone 'utc')::date,
  h.valor_neto,
  null,
  null,
  'aprobada',
  h.created_at,
  h.created_by
from public.fachada_hojalateria h
where h.cotizacion_key is null
  or btrim(h.cotizacion_key) = '';

insert into public.fachada_documentos (
  intervencion_id,
  tipo_documento,
  categoria,
  proveedor_id,
  numero,
  fecha,
  valor_neto,
  archivo_key,
  archivo_nombre,
  estado,
  created_at,
  created_by
)
select
  h.intervencion_id,
  'factura',
  'hojalateria',
  h.proveedor_id,
  null,
  (h.created_at at time zone 'utc')::date,
  h.valor_neto,
  h.factura_key,
  h.factura_nombre,
  'pendiente',
  h.created_at,
  h.created_by
from public.fachada_hojalateria h
where h.factura_key is not null
  and btrim(h.factura_key) <> '';

-- Facturas de materiales: una fila por (intervención, key, número, proveedor).
insert into public.fachada_documentos (
  intervencion_id,
  tipo_documento,
  categoria,
  proveedor_id,
  numero,
  fecha,
  valor_neto,
  archivo_key,
  archivo_nombre,
  estado,
  created_at,
  created_by
)
select
  m.intervencion_id,
  'factura',
  'materiales',
  m.proveedor_id,
  nullif(btrim(coalesce(m.numero_factura, '')), ''),
  min(m.fecha_compra),
  sum(m.valor_neto)::integer,
  m.factura_key,
  min(m.factura_nombre),
  'pendiente',
  min(m.created_at),
  (array_agg(m.created_by order by m.created_at))[1]
from public.fachada_materiales m
where m.factura_key is not null
  and btrim(m.factura_key) <> ''
group by
  m.intervencion_id,
  m.proveedor_id,
  m.factura_key,
  nullif(btrim(coalesce(m.numero_factura, '')), '');

-- ========== media: portada, orden, fecha ==========
alter table public.fachada_media
  add column es_portada boolean not null default false;

alter table public.fachada_media
  add column orden integer not null default 0;

alter table public.fachada_media
  add column fecha date;

update public.fachada_media
set fecha = (created_at at time zone 'utc')::date
where fecha is null;

create unique index fachada_media_portada_unica
  on public.fachada_media (intervencion_id, tipo)
  where es_portada;

comment on column public.fachada_media.es_portada is
  'Máximo una portada «antes» y una «después» por intervención (índice único parcial).';

comment on column public.fachada_media.orden is
  'Orden en la tira de miniaturas.';

comment on column public.fachada_media.fecha is
  'Fecha de la foto (default: día de subida).';

-- ========== RLS documentos (igual que el resto de Fachadas) ==========
do $$
declare
  t text := 'fachada_documentos';
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
