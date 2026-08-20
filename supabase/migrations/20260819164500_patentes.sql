-- Categoría Patentes: proyectos de clientes y recepción de obras.
--
-- Un "proyecto" es un trabajo (public.trabajos) del subtipo correspondiente.
-- Acciones, desglose de presupuesto y pagos van en tablas hijas.
-- La patente provisoria se guarda en trabajo_media.tipo = 'patente_provisoria'.

-- ========== catálogo ==========
insert into public.trabajo_categorias (nombre)
values ('Patentes')
on conflict (nombre) do nothing;

insert into public.trabajo_subtipos (categoria_id, nombre)
select c.id, s.nombre
from public.trabajo_categorias as c
cross join (
  values
    ('Clientes con patentes en proceso'),
    ('Proyecto recepción de obras')
) as s (nombre)
where c.nombre = 'Patentes'
on conflict (categoria_id, nombre) do nothing;

-- ========== trabajo_media: documentos + patente provisoria ==========
alter table public.trabajo_media
  add column if not exists nombre_archivo text;

comment on column public.trabajo_media.nombre_archivo is
  'Nombre original del archivo (útil para PDFs y planos).';

alter table public.trabajo_media
  drop constraint if exists trabajo_media_tipo_check;

alter table public.trabajo_media
  add constraint trabajo_media_tipo_check
  check (
    (trabajo_id is null or tipo is not null)
    and (
      tipo is null
      or tipo in ('antes', 'despues', 'adjunto', 'patente_provisoria')
    )
  );

comment on column public.trabajo_media.tipo is
  'antes | despues (Lluvias); adjunto | patente_provisoria (Patentes); null solo en cajón inbox.';

alter table public.trabajo_media
  drop constraint if exists trabajo_media_tipo_archivo_check;

alter table public.trabajo_media
  add constraint trabajo_media_tipo_archivo_check
  check (tipo_archivo in ('foto', 'video', 'documento'));

comment on column public.trabajo_media.tipo_archivo is
  'foto | video | documento.';

-- ========== acciones de seguimiento ==========
create table public.trabajo_acciones (
  id uuid primary key default gen_random_uuid(),
  trabajo_id uuid not null references public.trabajos (id) on delete cascade,
  descripcion text not null,
  fecha_entrega date,
  hecha boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.trabajo_acciones is
  'Siguientes acciones / hitos de seguimiento de un proyecto (Patentes y otros).';

create index trabajo_acciones_trabajo_id_idx
  on public.trabajo_acciones (trabajo_id, created_at);

-- ========== desglose de presupuesto ==========
create table public.trabajo_presupuesto_items (
  id uuid primary key default gen_random_uuid(),
  trabajo_id uuid not null references public.trabajos (id) on delete cascade,
  concepto text not null,
  monto numeric(14, 2) not null,
  created_at timestamptz not null default now()
);

comment on table public.trabajo_presupuesto_items is
  'Líneas del presupuesto de un proyecto (recepción de obras).';

create index trabajo_presupuesto_items_trabajo_id_idx
  on public.trabajo_presupuesto_items (trabajo_id, created_at);

-- ========== pagos por hito ==========
create table public.trabajo_pagos (
  id uuid primary key default gen_random_uuid(),
  trabajo_id uuid not null references public.trabajos (id) on delete cascade,
  hito text not null,
  monto numeric(14, 2),
  fecha_pago date,
  created_at timestamptz not null default now()
);

comment on table public.trabajo_pagos is
  'Pagos asociados a hitos del presupuesto / proyecto.';

create index trabajo_pagos_trabajo_id_idx
  on public.trabajo_pagos (trabajo_id, created_at);

-- ========== RLS (mismo patrón que trabajos) ==========
alter table public.trabajo_acciones enable row level security;
alter table public.trabajo_presupuesto_items enable row level security;
alter table public.trabajo_pagos enable row level security;

create policy "Roles can select trabajo_acciones"
  on public.trabajo_acciones for select
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente'));

create policy "Admin pablo asistente can insert trabajo_acciones"
  on public.trabajo_acciones for insert
  to authenticated
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo asistente can update trabajo_acciones"
  on public.trabajo_acciones for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente'))
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo can delete trabajo_acciones"
  on public.trabajo_acciones for delete
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));

create policy "Roles can select trabajo_presupuesto_items"
  on public.trabajo_presupuesto_items for select
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente'));

create policy "Admin pablo asistente can insert trabajo_presupuesto_items"
  on public.trabajo_presupuesto_items for insert
  to authenticated
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo asistente can update trabajo_presupuesto_items"
  on public.trabajo_presupuesto_items for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente'))
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo can delete trabajo_presupuesto_items"
  on public.trabajo_presupuesto_items for delete
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));

create policy "Roles can select trabajo_pagos"
  on public.trabajo_pagos for select
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente'));

create policy "Admin pablo asistente can insert trabajo_pagos"
  on public.trabajo_pagos for insert
  to authenticated
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo asistente can update trabajo_pagos"
  on public.trabajo_pagos for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente'))
  with check (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo can delete trabajo_pagos"
  on public.trabajo_pagos for delete
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));

grant select, insert, update, delete on table public.trabajo_acciones to authenticated;
grant all on table public.trabajo_acciones to service_role;
grant select, insert, update, delete on table public.trabajo_presupuesto_items to authenticated;
grant all on table public.trabajo_presupuesto_items to service_role;
grant select, insert, update, delete on table public.trabajo_pagos to authenticated;
grant all on table public.trabajo_pagos to service_role;
