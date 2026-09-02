-- Compras de materiales de un evento de filtración.
-- Tablas NUEVAS: no altera trabajos, eventos ni media existentes.

create table public.compras_materiales (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete restrict,
  fecha_compra date not null,
  proveedor text not null,
  numero_factura text not null,
  material text not null,
  valor_neto integer not null check (valor_neto >= 0),
  valor_iva integer not null check (valor_iva >= 0),
  valor_bruto integer not null check (valor_bruto >= 0),
  factura_key text,
  factura_nombre text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.perfiles (id),
  constraint compras_materiales_bruto_check
    check (valor_bruto = valor_neto + valor_iva)
);

comment on table public.compras_materiales is
  'Compra de materiales de un evento de filtración. El valor total vive aquí; el reparto por proyecto es solo de lectura en la app.';

comment on column public.compras_materiales.valor_iva is
  'IVA guardado (por defecto 19% del neto, editable).';

comment on column public.compras_materiales.factura_key is
  'Key de R2 (carpeta compras/{id}/…). Null = sin archivo.';

create index compras_materiales_evento_id_idx
  on public.compras_materiales (evento_id);

create index compras_materiales_fecha_compra_idx
  on public.compras_materiales (evento_id, fecha_compra desc);

create table public.compra_material_trabajos (
  compra_id uuid not null references public.compras_materiales (id) on delete cascade,
  trabajo_id uuid not null references public.trabajos (id) on delete restrict,
  primary key (compra_id, trabajo_id)
);

comment on table public.compra_material_trabajos is
  'Asociación many-to-many compra ↔ proyecto-filtración. Al menos una fila por compra (la app lo exige).';

create index compra_material_trabajos_trabajo_id_idx
  on public.compra_material_trabajos (trabajo_id);

create or replace function public.compra_trabajo_mismo_evento()
returns trigger
language plpgsql
as $$
declare
  ev uuid;
  tev uuid;
begin
  select evento_id into ev
  from public.compras_materiales
  where id = new.compra_id;

  select evento_id into tev
  from public.trabajos
  where id = new.trabajo_id;

  if ev is null or tev is null or ev is distinct from tev then
    raise exception
      'El proyecto-filtración no pertenece al mismo evento que la compra';
  end if;
  return new;
end;
$$;

create trigger compra_material_trabajos_mismo_evento
  before insert or update on public.compra_material_trabajos
  for each row
  execute function public.compra_trabajo_mismo_evento();

alter table public.compras_materiales enable row level security;
alter table public.compra_material_trabajos enable row level security;

create policy "Roles can select compras_materiales"
  on public.compras_materiales for select
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente'));

create policy "Admin pablo asistente can insert compras_materiales"
  on public.compras_materiales for insert
  to authenticated
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo asistente can update compras_materiales"
  on public.compras_materiales for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente'))
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo can delete compras_materiales"
  on public.compras_materiales for delete
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));

create policy "Roles can select compra_material_trabajos"
  on public.compra_material_trabajos for select
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente'));

create policy "Admin pablo asistente can insert compra_material_trabajos"
  on public.compra_material_trabajos for insert
  to authenticated
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo asistente can update compra_material_trabajos"
  on public.compra_material_trabajos for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente'))
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo can delete compra_material_trabajos"
  on public.compra_material_trabajos for delete
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));

grant select, insert, update, delete on table public.compras_materiales to authenticated;
grant all on table public.compras_materiales to service_role;
grant select, insert, update, delete on table public.compra_material_trabajos to authenticated;
grant all on table public.compra_material_trabajos to service_role;
