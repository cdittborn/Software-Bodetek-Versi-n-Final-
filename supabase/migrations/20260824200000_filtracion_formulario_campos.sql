-- Filtración-Proyecto: código FLT, campos de cotización/maestros, planos split, autor.
-- Reutiliza fecha_termino como fecha de entrega real (sin columna nueva).

-- ========== 1) Código legible FLT-0001 en trabajos (solo con evento_id) ==========
create sequence if not exists public.filtracion_codigo_seq start 1;

alter table public.trabajos
  add column if not exists codigo_filtracion text;

comment on column public.trabajos.codigo_filtracion is
  'Código visible tipo FLT-0001 (Filtración-Proyecto con evento_id).';

-- Backfill: registros existentes de filtración (evento_id) en orden de creación
with numbered as (
  select
    id,
    row_number() over (order by created_at asc, id asc) as n
  from public.trabajos
  where evento_id is not null
    and codigo_filtracion is null
)
update public.trabajos t
set codigo_filtracion = 'FLT-' || lpad(n.n::text, 4, '0')
from numbered n
where t.id = n.id;

-- Sincronizar secuencia para que el próximo insert sea el siguiente número libre
select setval(
  'public.filtracion_codigo_seq',
  coalesce(
    (
      select max(
        nullif(substring(codigo_filtracion from '^FLT-([0-9]+)$'), '')::integer
      )
      from public.trabajos
      where codigo_filtracion ~ '^FLT-[0-9]+$'
    ),
    0
  ),
  true
);

create or replace function public.asignar_codigo_filtracion()
returns trigger
language plpgsql
as $$
begin
  if new.evento_id is not null and new.codigo_filtracion is null then
    new.codigo_filtracion :=
      'FLT-' || lpad(nextval('public.filtracion_codigo_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trabajos_codigo_filtracion on public.trabajos;
create trigger trabajos_codigo_filtracion
  before insert on public.trabajos
  for each row
  execute function public.asignar_codigo_filtracion();

create unique index if not exists trabajos_codigo_filtracion_unique
  on public.trabajos (codigo_filtracion)
  where codigo_filtracion is not null;

-- ========== 2) Campos nuevos de ejecución / cotización / autor ==========
alter table public.trabajos
  add column if not exists horas_maestros_bodetek numeric(6, 2),
  add column if not exists numero_cotizacion text,
  add column if not exists valor_total_cotizacion numeric(14, 2),
  add column if not exists created_by uuid references public.perfiles (id);

comment on column public.trabajos.horas_maestros_bodetek is
  'Horas Maestros Bodetek (obligatorio si ejecutado_por = maestros_bodetek).';
comment on column public.trabajos.numero_cotizacion is
  'Número de cotización del proveedor externo.';
comment on column public.trabajos.valor_total_cotizacion is
  'Valor total de la cotización (puede cubrir varios recintos).';
comment on column public.trabajos.created_by is
  'Usuario que reportó/creó la filtración.';

comment on column public.trabajos.fecha_termino is
  'Fecha de entrega real (Filtración-Proyecto) o término en otros módulos.';

-- ========== 3) Dos tipos de plano en trabajo_media + migración legacy ==========
update public.trabajo_media
set tipo = 'plano_agua'
where tipo = 'plano_filtraciones';

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
        'cotizacion',
        'plano_filtraciones',
        'plano_agua',
        'plano_reparacion'
      )
    )
  );

comment on column public.trabajo_media.tipo is
  'antes|despues; adjunto|patente_provisoria; cotizacion; '
  'plano_agua|plano_reparacion (Filtración); plano_filtraciones (legacy, ya migrado).';
