-- Categoría privada "Otros trabajos CD" (owner_id = usuario específico).
-- Categorías con owner_id null conservan el RLS por rol actual.
-- No toca Patentes / Techos / Lluvias salvo ampliar policies compartidas.

-- ========== columna owner_id ==========
alter table public.trabajo_categorias
  add column if not exists owner_id uuid references auth.users (id) on delete set null;

comment on column public.trabajo_categorias.owner_id is
  'Si no es null, la categoría es privada: solo ese usuario (auth.uid) la ve/edita, sin importar el rol.';

create index if not exists trabajo_categorias_owner_id_idx
  on public.trabajo_categorias (owner_id)
  where owner_id is not null;

-- ========== helpers ==========
create or replace function public.puedo_ver_categoria(p_categoria_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trabajo_categorias as c
    where c.id = p_categoria_id
      and (c.owner_id is null or c.owner_id = auth.uid())
  );
$$;

create or replace function public.categoria_es_privada(p_categoria_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trabajo_categorias as c
    where c.id = p_categoria_id
      and c.owner_id is not null
  );
$$;

create or replace function public.soy_dueno_categoria(p_categoria_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trabajo_categorias as c
    where c.id = p_categoria_id
      and c.owner_id = auth.uid()
  );
$$;

revoke all on function public.puedo_ver_categoria(uuid) from public;
revoke all on function public.categoria_es_privada(uuid) from public;
revoke all on function public.soy_dueno_categoria(uuid) from public;
grant execute on function public.puedo_ver_categoria(uuid) to authenticated;
grant execute on function public.categoria_es_privada(uuid) to authenticated;
grant execute on function public.soy_dueno_categoria(uuid) to authenticated;

-- ========== catálogo privado ==========
insert into public.trabajo_categorias (nombre, owner_id)
select
  'Otros trabajos CD',
  u.id
from auth.users as u
where u.email = 'cdittborn@gmail.com'
on conflict (nombre) do update
set owner_id = excluded.owner_id;

insert into public.trabajo_subtipos (categoria_id, nombre)
select c.id, s.nombre
from public.trabajo_categorias as c
cross join (
  values
    ('Bodetek'),
    ('Hacienda Los Aromos'),
    ('Vías - Condominio Vicuña'),
    ('Grupo BD'),
    ('Premios Chile Naturaleza'),
    ('Parque Imaginario'),
    ('Personales'),
    ('Viaje')
) as s (nombre)
where c.nombre = 'Otros trabajos CD'
on conflict (categoria_id, nombre) do nothing;

-- ========== RLS trabajo_categorias ==========
drop policy if exists "Authenticated users can select trabajo_categorias"
  on public.trabajo_categorias;
drop policy if exists "Authenticated users can insert trabajo_categorias"
  on public.trabajo_categorias;
drop policy if exists "Authenticated users can update trabajo_categorias"
  on public.trabajo_categorias;
drop policy if exists "Authenticated users can delete trabajo_categorias"
  on public.trabajo_categorias;

create policy "Select trabajo_categorias publicas o propias"
  on public.trabajo_categorias for select
  to authenticated
  using (owner_id is null or owner_id = auth.uid());

create policy "Insert trabajo_categorias publicas o propias"
  on public.trabajo_categorias for insert
  to authenticated
  with check (owner_id is null or owner_id = auth.uid());

create policy "Update trabajo_categorias publicas o propias"
  on public.trabajo_categorias for update
  to authenticated
  using (owner_id is null or owner_id = auth.uid())
  with check (owner_id is null or owner_id = auth.uid());

create policy "Delete trabajo_categorias publicas o propias"
  on public.trabajo_categorias for delete
  to authenticated
  using (owner_id is null or owner_id = auth.uid());

-- ========== RLS trabajo_subtipos ==========
drop policy if exists "Authenticated users can select trabajo_subtipos"
  on public.trabajo_subtipos;
drop policy if exists "Authenticated users can insert trabajo_subtipos"
  on public.trabajo_subtipos;
drop policy if exists "Authenticated users can update trabajo_subtipos"
  on public.trabajo_subtipos;
drop policy if exists "Authenticated users can delete trabajo_subtipos"
  on public.trabajo_subtipos;

create policy "Select trabajo_subtipos por categoria visible"
  on public.trabajo_subtipos for select
  to authenticated
  using (public.puedo_ver_categoria(categoria_id));

create policy "Insert trabajo_subtipos por categoria visible"
  on public.trabajo_subtipos for insert
  to authenticated
  with check (public.puedo_ver_categoria(categoria_id));

create policy "Update trabajo_subtipos por categoria visible"
  on public.trabajo_subtipos for update
  to authenticated
  using (public.puedo_ver_categoria(categoria_id))
  with check (public.puedo_ver_categoria(categoria_id));

create policy "Delete trabajo_subtipos por categoria visible"
  on public.trabajo_subtipos for delete
  to authenticated
  using (public.puedo_ver_categoria(categoria_id));

-- ========== RLS trabajos ==========
drop policy if exists "Roles can select trabajos" on public.trabajos;
drop policy if exists "Admin pablo asistente can insert trabajos" on public.trabajos;
drop policy if exists "Admin pablo asistente can update trabajos" on public.trabajos;
drop policy if exists "Admin pablo can delete trabajos" on public.trabajos;

create policy "Select trabajos publicos por rol o privados propios"
  on public.trabajos for select
  to authenticated
  using (
    (
      not public.categoria_es_privada(categoria_id)
      and public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente')
    )
    or public.soy_dueno_categoria(categoria_id)
  );

create policy "Insert trabajos publicos por rol o privados propios"
  on public.trabajos for insert
  to authenticated
  with check (
    (
      not public.categoria_es_privada(categoria_id)
      and public.mi_rol() in ('admin', 'pablo', 'asistente')
    )
    or public.soy_dueno_categoria(categoria_id)
  );

create policy "Update trabajos publicos por rol o privados propios"
  on public.trabajos for update
  to authenticated
  using (
    (
      not public.categoria_es_privada(categoria_id)
      and public.mi_rol() in ('admin', 'pablo', 'asistente')
    )
    or public.soy_dueno_categoria(categoria_id)
  )
  with check (
    (
      not public.categoria_es_privada(categoria_id)
      and public.mi_rol() in ('admin', 'pablo', 'asistente')
    )
    or public.soy_dueno_categoria(categoria_id)
  );

create policy "Delete trabajos publicos por rol o privados propios"
  on public.trabajos for delete
  to authenticated
  using (
    (
      not public.categoria_es_privada(categoria_id)
      and public.mi_rol() in ('admin', 'pablo')
    )
    or public.soy_dueno_categoria(categoria_id)
  );

-- ========== RLS trabajo_media ==========
drop policy if exists "Roles can select trabajo_media" on public.trabajo_media;
drop policy if exists "Roles can insert trabajo_media" on public.trabajo_media;
drop policy if exists "Admin pablo asistente can update trabajo_media" on public.trabajo_media;
drop policy if exists "Admin pablo can delete trabajo_media" on public.trabajo_media;

create policy "Select trabajo_media por acceso a trabajo o inbox"
  on public.trabajo_media for select
  to authenticated
  using (
    (
      trabajo_id is not null
      and exists (
        select 1
        from public.trabajos as t
        where t.id = trabajo_media.trabajo_id
          and (
            (
              not public.categoria_es_privada(t.categoria_id)
              and public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente')
            )
            or public.soy_dueno_categoria(t.categoria_id)
          )
      )
    )
    or (
      trabajo_id is null
      and public.mi_rol() in ('admin', 'pablo', 'asistente')
    )
  );

create policy "Insert trabajo_media por acceso a trabajo o inbox"
  on public.trabajo_media for insert
  to authenticated
  with check (
    (
      trabajo_id is not null
      and exists (
        select 1
        from public.trabajos as t
        where t.id = trabajo_media.trabajo_id
          and (
            (
              not public.categoria_es_privada(t.categoria_id)
              and public.mi_rol() in ('admin', 'pablo', 'asistente')
            )
            or public.soy_dueno_categoria(t.categoria_id)
          )
      )
    )
    or (
      trabajo_id is null
      and public.mi_rol() in ('admin', 'pablo')
    )
  );

create policy "Update trabajo_media por acceso a trabajo o inbox"
  on public.trabajo_media for update
  to authenticated
  using (
    (
      trabajo_id is not null
      and exists (
        select 1
        from public.trabajos as t
        where t.id = trabajo_media.trabajo_id
          and (
            (
              not public.categoria_es_privada(t.categoria_id)
              and public.mi_rol() in ('admin', 'pablo', 'asistente')
            )
            or public.soy_dueno_categoria(t.categoria_id)
          )
      )
    )
    or (
      trabajo_id is null
      and public.mi_rol() in ('admin', 'pablo', 'asistente')
    )
  )
  with check (
    (
      trabajo_id is not null
      and exists (
        select 1
        from public.trabajos as t
        where t.id = trabajo_media.trabajo_id
          and (
            (
              not public.categoria_es_privada(t.categoria_id)
              and public.mi_rol() in ('admin', 'pablo', 'asistente')
            )
            or public.soy_dueno_categoria(t.categoria_id)
          )
      )
    )
    or (
      trabajo_id is null
      and public.mi_rol() in ('admin', 'pablo')
    )
  );

create policy "Delete trabajo_media por acceso a trabajo o inbox"
  on public.trabajo_media for delete
  to authenticated
  using (
    (
      trabajo_id is not null
      and exists (
        select 1
        from public.trabajos as t
        where t.id = trabajo_media.trabajo_id
          and (
            (
              not public.categoria_es_privada(t.categoria_id)
              and public.mi_rol() in ('admin', 'pablo')
            )
            or public.soy_dueno_categoria(t.categoria_id)
          )
      )
    )
    or (
      trabajo_id is null
      and public.mi_rol() in ('admin', 'pablo')
    )
  );
