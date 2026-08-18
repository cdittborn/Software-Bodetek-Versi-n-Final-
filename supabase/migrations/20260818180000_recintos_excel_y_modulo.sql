-- Recintos: columnas del Excel (Vista CD) + unique compuesto
-- y módulo recintos en modulo_permisos (admin/pablo/asistente).

-- ========== columnas nuevas ==========
alter table public.recintos
  add column if not exists sitio text not null default '',
  add column if not exists galpon text not null default '',
  add column if not exists arrendatario_actual text,
  add column if not exists superficie_1er_piso numeric(12, 2),
  add column if not exists superficie_2o_piso numeric(12, 2);

comment on column public.recintos.sitio is 'Sitio del recinto (Excel Vista CD).';
comment on column public.recintos.galpon is 'Galpón dentro del sitio.';
comment on column public.recintos.arrendatario_actual is 'Arrendatario vigente (snapshot).';
comment on column public.recintos.superficie_1er_piso is 'm2 primer piso.';
comment on column public.recintos.superficie_2o_piso is 'm2 segundo piso.';

-- ========== unique: deja de ser global en codigo ==========
alter table public.recintos
  drop constraint if exists recintos_codigo_key;

alter table public.recintos
  drop constraint if exists recintos_sitio_galpon_codigo_key;

alter table public.recintos
  add constraint recintos_sitio_galpon_codigo_key
  unique (sitio, galpon, codigo);

-- ========== modulo_permisos: agregar recintos ==========
alter table public.modulo_permisos
  drop constraint if exists modulo_permisos_modulo_check;

alter table public.modulo_permisos
  add constraint modulo_permisos_modulo_check
  check (
    modulo in (
      'rentas',
      'trabajos',
      'ggcc',
      'legal',
      'usuarios',
      'recintos'
    )
  );

insert into public.modulo_permisos (rol, modulo, puede_ver, puede_editar)
values
  ('admin', 'recintos', true, true),
  ('pablo', 'recintos', true, true),
  ('asistente', 'recintos', true, false)
on conflict (rol, modulo) do update
set
  puede_ver = excluded.puede_ver,
  puede_editar = excluded.puede_editar;

-- ========== RLS: socio/cliente no leen recintos ==========
drop policy if exists "Roles can select recintos" on public.recintos;
drop policy if exists "Admin pablo asistente can insert recintos" on public.recintos;
drop policy if exists "Admin pablo asistente can update recintos" on public.recintos;

create policy "Admin pablo asistente can select recintos"
  on public.recintos for select
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente'));

create policy "Admin pablo can insert recintos"
  on public.recintos for insert
  to authenticated
  with check (public.mi_rol() in ('admin', 'pablo'));

create policy "Admin pablo can update recintos"
  on public.recintos for update
  to authenticated
  using (public.mi_rol() in ('admin', 'pablo'))
  with check (public.mi_rol() in ('admin', 'pablo'));
