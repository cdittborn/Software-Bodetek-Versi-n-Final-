-- Prueba LOCAL de 20261104120000. Nunca contra producción.
-- Un usuario de cada rol. Primero ven lo mismo que hoy. Después se le
-- desmarca una subcategoría a uno y los demás no cambian.
\set ON_ERROR_STOP 1

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticator') then
    raise exception 'ABORTADO: esta base parece Supabase. Solo se corre en una base local vacía.';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

create schema auth;
create function auth.uid() returns uuid language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to authenticated, anon, service_role;
grant usage on schema public to authenticated, anon, service_role;

create schema supabase_migrations;
create table supabase_migrations.schema_migrations (
  version text primary key, name text, statements text[]
);
insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20261103230000', 'menu_categorias', array['-- ya aplicada en esta copia']);

create table public.perfiles (
  id uuid primary key,
  rol text not null,
  nombre text
);
alter table public.perfiles enable row level security;
create policy "Authenticated users can select perfiles" on public.perfiles for select to authenticated using (true);
create policy "Authenticated users can update perfiles" on public.perfiles for update to authenticated using (true) with check (true);
grant select, update on public.perfiles to authenticated;

create table public.trabajo_categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  owner_id uuid,
  orden integer,
  color text,
  clave text,
  protegida boolean not null default false,
  archivada boolean not null default false
);
create table public.trabajo_subtipos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.trabajo_categorias (id),
  nombre text not null,
  orden integer,
  clave text,
  protegida boolean not null default false
);
create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  subtipo_id uuid not null references public.trabajo_subtipos (id),
  nombre text not null
);
create table public.trabajos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references public.trabajo_categorias (id),
  subtipo_id uuid references public.trabajo_subtipos (id),
  evento_id uuid references public.eventos (id),
  titulo text not null
);
create table public.trabajo_media (
  id uuid primary key default gen_random_uuid(),
  trabajo_id uuid references public.trabajos (id)
);
create table public.compras_materiales (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id)
);
create table public.compra_material_trabajos (
  compra_id uuid not null references public.compras_materiales (id),
  trabajo_id uuid not null references public.trabajos (id),
  primary key (compra_id, trabajo_id)
);
create table public.informes_seguro (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id)
);
create table public.informe_seguro_recintos (
  informe_id uuid not null references public.informes_seguro (id)
);
create table public.informe_seguro_subproyectos (
  informe_id uuid not null references public.informes_seguro (id)
);
create table public.informe_seguro_media (
  informe_id uuid not null references public.informes_seguro (id)
);
create table public.informe_seguro_versiones (
  informe_id uuid not null references public.informes_seguro (id)
);

create function public.mi_rol() returns text
language sql stable security definer set search_path = public set row_security = off
as $$ select rol from public.perfiles where id = auth.uid() $$;
create function public.soy_dueno_categoria(p_categoria_id uuid) returns boolean
language sql stable security definer set search_path = public set row_security = off
as $$
  select exists (
    select 1 from public.trabajo_categorias c
    where c.id = p_categoria_id and c.owner_id = auth.uid()
  );
$$;
create function public.categoria_es_privada(p_categoria_id uuid) returns boolean
language sql stable security definer set search_path = public set row_security = off
as $$
  select exists (
    select 1 from public.trabajo_categorias c
    where c.id = p_categoria_id and c.owner_id is not null
  );
$$;
grant execute on function public.mi_rol() to authenticated;
grant execute on function public.soy_dueno_categoria(uuid) to authenticated;
grant execute on function public.categoria_es_privada(uuid) to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'fachadas', 'fachada_intervenciones', 'fachada_intervencion_tipos',
    'fachada_cotizaciones', 'fachada_cotizacion_tipos', 'fachada_hojalateria',
    'fachada_materiales', 'fachada_media', 'fachada_documentos',
    'fachada_archivos', 'fachada_recintos', 'fachadas_reportes',
    'fachadas_reporte_versiones'
  ]
  loop
    execute format('create table public.%I (id uuid primary key default gen_random_uuid())', t);
    execute format('insert into public.%I default values', t);
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.mi_rol() in (''admin'', ''pablo'', ''asistente'', ''socio'', ''cliente''))',
      'Roles can select ' || t, t
    );
    execute format('grant select on public.%I to authenticated, service_role', t);
  end loop;
end $$;

alter table public.eventos enable row level security;
alter table public.trabajos enable row level security;
alter table public.trabajo_media enable row level security;
alter table public.compras_materiales enable row level security;
alter table public.compra_material_trabajos enable row level security;
alter table public.informes_seguro enable row level security;
alter table public.informe_seguro_recintos enable row level security;
alter table public.informe_seguro_subproyectos enable row level security;
alter table public.informe_seguro_media enable row level security;
alter table public.informe_seguro_versiones enable row level security;

create policy "Roles can select eventos" on public.eventos for select to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente'));
create policy "Select trabajos publicos por rol o privados propios" on public.trabajos for select to authenticated
  using (
    (not public.categoria_es_privada(categoria_id) and public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente'))
    or public.soy_dueno_categoria(categoria_id)
  );
create policy "Select trabajo_media por acceso a trabajo o inbox" on public.trabajo_media for select to authenticated
  using (
    (trabajo_id is not null and exists (
      select 1 from public.trabajos t
      where t.id = trabajo_media.trabajo_id
        and (
          (not public.categoria_es_privada(t.categoria_id) and public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente'))
          or public.soy_dueno_categoria(t.categoria_id)
        )
    ))
    or (trabajo_id is null and public.mi_rol() in ('admin', 'pablo', 'asistente'))
  );
create policy "Roles can select compras_materiales" on public.compras_materiales for select to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente'));
create policy "Roles can select compra_material_trabajos" on public.compra_material_trabajos for select to authenticated
  using (public.mi_rol() in ('admin', 'pablo', 'asistente', 'socio', 'cliente'));
create policy "informes_seguro_select_admin_pablo" on public.informes_seguro for select to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));
create policy "informe_seguro_recintos_select_admin_pablo" on public.informe_seguro_recintos for select to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));
create policy "informe_seguro_subproyectos_select_admin_pablo" on public.informe_seguro_subproyectos for select to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));
create policy "informe_seguro_media_select_admin_pablo" on public.informe_seguro_media for select to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));
create policy "informe_seguro_versiones_select_admin_pablo" on public.informe_seguro_versiones for select to authenticated
  using (public.mi_rol() in ('admin', 'pablo'));

grant select on public.trabajo_categorias, public.trabajo_subtipos, public.eventos, public.trabajos,
  public.trabajo_media, public.compras_materiales, public.compra_material_trabajos,
  public.informes_seguro, public.informe_seguro_recintos, public.informe_seguro_subproyectos,
  public.informe_seguro_media, public.informe_seguro_versiones
  to authenticated, service_role;

create table fijo (nombre text primary key, id uuid not null);
insert into fijo (nombre, id) values
  ('admin', '11111111-1111-4111-8111-111111111111'),
  ('pablo', '22222222-2222-4222-8222-222222222222'),
  ('asistente', '33333333-3333-4333-8333-333333333333'),
  ('socio', '44444444-4444-4444-8444-444444444444'),
  ('cliente', '55555555-5555-4555-8555-555555555555'),
  ('cat_tec', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  ('sub_lluvias', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
  ('sub_rev', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'),
  ('cat_ima', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'),
  ('sub_fach', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5'),
  ('cat_proto', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6'),
  ('cat_priv', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7'),
  ('sub_priv', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8');

insert into public.perfiles (id, nombre, rol)
select id, nombre, nombre from fijo where nombre in ('admin', 'pablo', 'asistente', 'socio', 'cliente');

insert into public.trabajo_categorias (id, nombre, orden, clave, archivada, owner_id) values
  ((select id from fijo where nombre = 'cat_tec'), 'Techumbres y canales', 1, 'techumbres', false, null),
  ((select id from fijo where nombre = 'cat_ima'), 'Imagen', 2, 'imagen', false, null),
  ((select id from fijo where nombre = 'cat_proto'), 'Protocolos', 3, null, false, null),
  ((select id from fijo where nombre = 'cat_priv'), 'Otros trabajos CD', 7, 'otros_trabajos_cd', true,
    (select id from fijo where nombre = 'admin'));

insert into public.trabajo_subtipos (id, categoria_id, nombre, orden, clave) values
  ((select id from fijo where nombre = 'sub_lluvias'), (select id from fijo where nombre = 'cat_tec'), 'Lluvias y temporales', 1, 'lluvias_temporales'),
  ((select id from fijo where nombre = 'sub_rev'), (select id from fijo where nombre = 'cat_tec'), 'Revisiones y mantenciones periódicas', 2, 'revisiones_mantenciones'),
  ((select id from fijo where nombre = 'sub_fach'), (select id from fijo where nombre = 'cat_ima'), 'Fachadas', 1, 'fachadas'),
  ((select id from fijo where nombre = 'sub_priv'), (select id from fijo where nombre = 'cat_priv'), 'Personales', 1, null);

insert into public.eventos (id, subtipo_id, nombre)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', (select id from fijo where nombre = 'sub_lluvias'), 'Temporal de prueba');

insert into public.trabajos (id, categoria_id, subtipo_id, evento_id, titulo) values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', (select id from fijo where nombre = 'cat_tec'), (select id from fijo where nombre = 'sub_lluvias'), 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'Filtración'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', (select id from fijo where nombre = 'cat_tec'), (select id from fijo where nombre = 'sub_rev'), null, 'Revisión'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', (select id from fijo where nombre = 'cat_ima'), (select id from fijo where nombre = 'sub_fach'), null, 'Fachada local'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5', (select id from fijo where nombre = 'cat_proto'), null, null, 'Protocolo'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6', (select id from fijo where nombre = 'cat_priv'), (select id from fijo where nombre = 'sub_priv'), null, 'Privado');

insert into public.trabajo_media (trabajo_id)
select id from public.trabajos
union all
select null;

insert into public.compras_materiales (id, evento_id)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1');
insert into public.compra_material_trabajos (compra_id, trabajo_id)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2');

insert into public.informes_seguro (id, evento_id)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1');
insert into public.informe_seguro_recintos (informe_id) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8');
insert into public.informe_seguro_subproyectos (informe_id) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8');
insert into public.informe_seguro_media (informe_id) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8');
insert into public.informe_seguro_versiones (informe_id) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8');

create table actores (quien text primary key, id uuid not null);
insert into actores (quien, id)
select nombre, id from fijo where nombre in ('admin', 'pablo', 'asistente', 'socio', 'cliente');

create table tablas_conteo (nombre text primary key);
insert into tablas_conteo (nombre) values
  ('trabajos'), ('eventos'), ('trabajo_media'), ('compras_materiales'), ('compra_material_trabajos'),
  ('fachadas'), ('fachada_intervenciones'), ('fachada_intervencion_tipos'),
  ('fachada_cotizaciones'), ('fachada_cotizacion_tipos'), ('fachada_hojalateria'),
  ('fachada_materiales'), ('fachada_media'), ('fachada_documentos'),
  ('fachada_archivos'), ('fachada_recintos'), ('fachadas_reportes'), ('fachadas_reporte_versiones'),
  ('informes_seguro'), ('informe_seguro_recintos'), ('informe_seguro_subproyectos'),
  ('informe_seguro_media'), ('informe_seguro_versiones');

create table prueba_conteo (
  fase text not null,
  quien text not null,
  tabla text not null,
  n integer not null,
  primary key (fase, quien, tabla)
);
grant insert on public.prueba_conteo to authenticated;
grant select on public.tablas_conteo, public.actores to authenticated;

create procedure anotar(p_fase text)
language plpgsql
as $$
declare
  r record;
  t record;
  n integer;
begin
  for r in select * from actores loop
    perform set_config('request.jwt.claim.sub', r.id::text, true);
    execute 'set local role authenticated';
    for t in select nombre from tablas_conteo loop
      execute format('select count(*) from public.%I', t.nombre) into n;
      insert into prueba_conteo (fase, quien, tabla, n) values (p_fase, r.quien, t.nombre, n);
    end loop;
    execute 'reset role';
  end loop;
end;
$$;

call anotar('base');

do $$
declare
  r record;
  esperado integer;
begin
  for r in select * from prueba_conteo where fase = 'base' loop
    esperado := case
      when r.tabla = 'trabajos' and r.quien = 'admin' then 5
      when r.tabla = 'trabajos' then 4
      when r.tabla = 'trabajo_media' and r.quien = 'admin' then 6
      when r.tabla = 'trabajo_media' and r.quien in ('pablo', 'asistente') then 5
      when r.tabla = 'trabajo_media' then 4
      when r.tabla like 'informe%' and r.quien in ('admin', 'pablo') then 1
      when r.tabla like 'informe%' then 0
      else 1
    end;
    if r.n <> esperado then
      raise exception 'hoy % ve % filas en %; se esperaban %', r.quien, r.n, r.tabla, esperado;
    end if;
  end loop;
end $$;

\ir ../supabase/migrations/20261104120000_usuario_visibilidad.sql

insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20261104120000', 'usuario_visibilidad', array['-- prueba local']);

\ir verificar-usuario-visibilidad.sql
set default_transaction_read_only = off;

call anotar('todo');

do $$
declare
  r record;
begin
  for r in
    select b.quien, b.tabla, b.n as hoy, t.n as despues
    from prueba_conteo b
    join prueba_conteo t on t.quien = b.quien and t.tabla = b.tabla and t.fase = 'todo'
    where b.fase = 'base' and b.n is distinct from t.n
  loop
    raise exception 'con todo marcado, % pasó de % a % en %', r.quien, r.hoy, r.despues, r.tabla;
  end loop;
  if exists (select 1 from public.perfiles where visibilidad_personalizada) then
    raise exception 'alguien quedó restringido sin que nadie lo guardara';
  end if;
  if exists (select 1 from public.usuario_visibilidad) then
    raise exception 'la tabla nueva no debería tener filas el primer día';
  end if;
end $$;

-- Un usuario nuevo, creado después, también ve todo.
insert into fijo (nombre, id) values ('nuevo', '66666666-6666-4666-8666-666666666666');
insert into public.perfiles (id, nombre, rol)
values ('66666666-6666-4666-8666-666666666666', 'Nuevo socio', 'socio');
insert into actores (quien, id) values ('nuevo', '66666666-6666-4666-8666-666666666666');
call anotar('nuevo');

do $$
declare
  r record;
begin
  for r in
    select s.tabla, s.n as socio, n.n as nuevo
    from prueba_conteo s
    join prueba_conteo n on n.tabla = s.tabla and n.fase = 'nuevo' and n.quien = 'nuevo'
    where s.fase = 'base' and s.quien = 'socio' and s.n is distinct from n.n
  loop
    raise exception 'el usuario nuevo ve % en % y un socio de hoy ve %', r.nuevo, r.tabla, r.socio;
  end loop;
end $$;

select set_config(
  'request.jwt.claim.sub',
  (select id::text from fijo where nombre = 'admin'),
  false
);

select public.guardar_visibilidad_usuario(
  (select id from fijo where nombre = 'asistente'),
  false,
  jsonb_build_array(
    jsonb_build_object('categoria_id', (select id from fijo where nombre = 'cat_tec'), 'subtipo_id', (select id from fijo where nombre = 'sub_lluvias')),
    jsonb_build_object('categoria_id', (select id from fijo where nombre = 'cat_ima'), 'subtipo_id', (select id from fijo where nombre = 'sub_fach')),
    jsonb_build_object('categoria_id', (select id from fijo where nombre = 'cat_proto'), 'subtipo_id', null)
  )
);

call anotar('sin_revisiones');

do $$
declare
  r record;
  esperado integer;
begin
  for r in
    select b.quien, b.tabla, t.n - b.n as delta
    from prueba_conteo b
    join prueba_conteo t on t.quien = b.quien and t.tabla = b.tabla and t.fase = 'sin_revisiones'
    where b.fase = 'base' and b.quien <> 'nuevo'
  loop
    esperado := case
      when r.quien = 'asistente' and r.tabla in ('trabajos', 'trabajo_media') then -1
      else 0
    end;
    if r.delta is distinct from esperado then
      raise exception 'al desmarcar Revisiones, % cambió % en % (se esperaba %)', r.quien, r.delta, r.tabla, esperado;
    end if;
  end loop;
end $$;

-- Volver a marcar todo y desmarcar Fachadas solo al cliente.
select public.guardar_visibilidad_usuario((select id from fijo where nombre = 'asistente'), true, '[]'::jsonb);
select public.guardar_visibilidad_usuario(
  (select id from fijo where nombre = 'cliente'),
  false,
  jsonb_build_array(
    jsonb_build_object('categoria_id', (select id from fijo where nombre = 'cat_tec'), 'subtipo_id', (select id from fijo where nombre = 'sub_lluvias')),
    jsonb_build_object('categoria_id', (select id from fijo where nombre = 'cat_tec'), 'subtipo_id', (select id from fijo where nombre = 'sub_rev')),
    jsonb_build_object('categoria_id', (select id from fijo where nombre = 'cat_proto'), 'subtipo_id', null)
  )
);
call anotar('sin_fachadas');

do $$
declare
  r record;
  esperado integer;
begin
  for r in
    select b.quien, b.tabla, t.n - b.n as delta
    from prueba_conteo b
    join prueba_conteo t on t.quien = b.quien and t.tabla = b.tabla and t.fase = 'sin_fachadas'
    where b.fase = 'base' and b.quien <> 'nuevo'
  loop
    esperado := case
      when r.quien = 'cliente' and (r.tabla = 'trabajos' or r.tabla = 'trabajo_media' or r.tabla like 'fachada%') then -1
      else 0
    end;
    if r.delta is distinct from esperado then
      raise exception 'al desmarcar Fachadas, % cambió % en % (se esperaba %)', r.quien, r.delta, r.tabla, esperado;
    end if;
  end loop;
end $$;

-- El link público no usa la sesión de la persona: service_role pasa por encima de RLS.
select public.guardar_visibilidad_usuario((select id from fijo where nombre = 'cliente'), true, '[]'::jsonb);
select public.guardar_visibilidad_usuario(
  (select id from fijo where nombre = 'pablo'),
  false,
  jsonb_build_array(
    jsonb_build_object('categoria_id', (select id from fijo where nombre = 'cat_tec'), 'subtipo_id', (select id from fijo where nombre = 'sub_rev')),
    jsonb_build_object('categoria_id', (select id from fijo where nombre = 'cat_ima'), 'subtipo_id', (select id from fijo where nombre = 'sub_fach')),
    jsonb_build_object('categoria_id', (select id from fijo where nombre = 'cat_proto'), 'subtipo_id', null)
  )
);
call anotar('sin_lluvias');

do $$
declare
  r record;
  esperado integer;
begin
  for r in
    select b.quien, b.tabla, t.n - b.n as delta
    from prueba_conteo b
    join prueba_conteo t on t.quien = b.quien and t.tabla = b.tabla and t.fase = 'sin_lluvias'
    where b.fase = 'base' and b.quien <> 'nuevo'
  loop
    esperado := case
      when r.quien = 'pablo' and r.tabla in ('trabajos', 'eventos', 'compras_materiales', 'compra_material_trabajos') then -1
      when r.quien = 'pablo' and r.tabla = 'trabajo_media' then -2
      when r.quien = 'pablo' and r.tabla like 'informe%' then -1
      else 0
    end;
    if r.delta is distinct from esperado then
      raise exception 'al desmarcar Lluvias a Pablo, % cambió % en % (se esperaba %)', r.quien, r.delta, r.tabla, esperado;
    end if;
  end loop;
end $$;

grant select on all tables in schema public to service_role;
grant insert on public.prueba_conteo to service_role;
set role service_role;
insert into public.prueba_conteo (fase, quien, tabla, n)
select 'publico', 'service_role', 'informes_seguro', count(*)::integer from public.informes_seguro;
reset role;

do $$
declare
  n integer;
begin
  select c.n into n from prueba_conteo c
  where c.fase = 'publico' and c.quien = 'service_role' and c.tabla = 'informes_seguro';
  if n is distinct from 1 then
    raise exception 'el rol del link público dejó de ver el informe (vio %)', n;
  end if;
  if not (select rolbypassrls from pg_roles where rolname = 'service_role') then
    raise exception 'service_role debería saltarse RLS, como en Supabase';
  end if;
end $$;

-- Un asistente no puede devolverse la vista, ni guardar la de otro.
select set_config('request.jwt.claim.sub', (select id::text from fijo where nombre = 'asistente'), false);
set role authenticated;
do $$
begin
  begin
    update public.perfiles set visibilidad_personalizada = false
    where id = (select id from fijo where nombre = 'pablo');
    raise exception 'el asistente pudo cambiar la marca';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform public.guardar_visibilidad_usuario(
      (select id from fijo where nombre = 'pablo'), true, '[]'::jsonb
    );
    raise exception 'el asistente pudo guardar la visibilidad';
  exception when insufficient_privilege then
    null;
  end;
end $$;
reset role;

select set_config('request.jwt.claim.sub', (select id::text from fijo where nombre = 'admin'), false);
do $$
begin
  begin
    perform public.guardar_visibilidad_usuario(
      (select id from fijo where nombre = 'admin'), false, '[]'::jsonb
    );
    raise exception 'se dejó restringir a un administrador';
  exception when insufficient_privilege then
    null;
  end;
end $$;

-- Pablo borra una subcategoría vacía que el asistente tiene marcada.
-- La cascada tiene que llevarse esa fila. Un borrado directo, no.
insert into public.trabajo_subtipos (id, categoria_id, nombre, orden)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9',
  (select id from fijo where nombre = 'cat_tec'),
  'Vacía de prueba',
  9
);

select set_config('request.jwt.claim.sub', (select id::text from fijo where nombre = 'admin'), false);
select public.guardar_visibilidad_usuario(
  (select id from fijo where nombre = 'asistente'),
  false,
  jsonb_build_array(
    jsonb_build_object(
      'categoria_id', (select id from fijo where nombre = 'cat_tec'),
      'subtipo_id', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9'
    ),
    jsonb_build_object(
      'categoria_id', (select id from fijo where nombre = 'cat_tec'),
      'subtipo_id', (select id from fijo where nombre = 'sub_lluvias')
    )
  )
);

grant select, delete on public.trabajo_subtipos to authenticated;
select set_config('request.jwt.claim.sub', (select id::text from fijo where nombre = 'pablo'), false);
set role authenticated;
delete from public.trabajo_subtipos where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9';
reset role;

do $$
begin
  if exists (
    select 1 from public.trabajo_subtipos where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9'
  ) then
    raise exception 'Pablo no pudo borrar la subcategoría vacía';
  end if;
  if exists (
    select 1 from public.usuario_visibilidad
    where subtipo_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9'
  ) then
    raise exception 'quedó la marca de la subcategoría que Pablo borró';
  end if;
  if not exists (
    select 1 from public.usuario_visibilidad
    where usuario_id = (select id from fijo where nombre = 'asistente')
      and subtipo_id = (select id from fijo where nombre = 'sub_lluvias')
  ) then
    raise exception 'al borrar la subcategoría vacía se llevó otra marca del asistente';
  end if;
end $$;

-- La clave de servicio borra un perfil que tiene filas de visibilidad.
insert into public.perfiles (id, nombre, rol)
values ('77777777-7777-4777-8777-777777777777', 'Para borrar', 'socio');
select set_config('request.jwt.claim.sub', (select id::text from fijo where nombre = 'admin'), false);
select public.guardar_visibilidad_usuario(
  '77777777-7777-4777-8777-777777777777',
  false,
  jsonb_build_array(
    jsonb_build_object(
      'categoria_id', (select id from fijo where nombre = 'cat_proto'),
      'subtipo_id', null
    )
  )
);

grant select, delete on public.perfiles to service_role;
select set_config('request.jwt.claim.sub', '', false);
set role service_role;
delete from public.perfiles where id = '77777777-7777-4777-8777-777777777777';
reset role;

do $$
begin
  if exists (select 1 from public.perfiles where id = '77777777-7777-4777-8777-777777777777') then
    raise exception 'la clave de servicio no pudo borrar el perfil';
  end if;
  if exists (
    select 1 from public.usuario_visibilidad
    where usuario_id = '77777777-7777-4777-8777-777777777777'
  ) then
    raise exception 'quedaron filas de visibilidad del perfil borrado';
  end if;
end $$;

-- Con permiso de borrar la tabla, un borrado directo sigue exigiendo admin.
grant delete on public.usuario_visibilidad to authenticated, service_role;
select set_config('request.jwt.claim.sub', (select id::text from fijo where nombre = 'asistente'), false);
set role authenticated;
do $$
begin
  delete from public.usuario_visibilidad
  where usuario_id = (select id from fijo where nombre = 'asistente');
  raise exception 'el asistente borró su visibilidad directo';
exception when insufficient_privilege then
  null;
end $$;
reset role;

select set_config('request.jwt.claim.sub', '', false);
set role service_role;
do $$
begin
  delete from public.usuario_visibilidad
  where usuario_id = (select id from fijo where nombre = 'asistente');
  raise exception 'la clave de servicio borró visibilidad directo';
exception when insufficient_privilege then
  null;
end $$;
reset role;

select set_config('request.jwt.claim.sub', (select id::text from fijo where nombre = 'admin'), false);
delete from public.usuario_visibilidad
where usuario_id = (select id from fijo where nombre = 'asistente')
  and subtipo_id = (select id from fijo where nombre = 'sub_lluvias');

do $$
begin
  if exists (
    select 1 from public.usuario_visibilidad
    where usuario_id = (select id from fijo where nombre = 'asistente')
      and subtipo_id = (select id from fijo where nombre = 'sub_lluvias')
  ) then
    raise exception 'el admin no pudo borrar una marca directo';
  end if;
end $$;

-- Resultado que se lee al terminar. base y todo tienen que ser iguales.
select b.quien, b.tabla, b.n as hoy, t.n as con_todo_marcado, s.n as asistente_sin_revisiones
from prueba_conteo b
join prueba_conteo t on t.quien = b.quien and t.tabla = b.tabla and t.fase = 'todo'
join prueba_conteo s on s.quien = b.quien and s.tabla = b.tabla and s.fase = 'sin_revisiones'
where b.fase = 'base'
  and b.quien <> 'nuevo'
  and b.tabla in ('trabajos', 'eventos', 'trabajo_media', 'compras_materiales', 'fachadas', 'informes_seguro')
order by b.tabla, b.quien;

select 'link público ve informes' as chequeo, n
from prueba_conteo
where fase = 'publico' and quien = 'service_role';

\ir ../supabase/rollback/20261104120000_usuario_visibilidad_down.sql
call anotar('rollback');

do $$
declare
  r record;
begin
  for r in
    select b.quien, b.tabla, b.n as hoy, t.n as despues
    from prueba_conteo b
    join prueba_conteo t on t.quien = b.quien and t.tabla = b.tabla and t.fase = 'rollback'
    where b.fase = 'base' and b.n is distinct from t.n
  loop
    raise exception 'después del rollback, % ve % en % y hoy veía %', r.quien, r.despues, r.tabla, r.hoy;
  end loop;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'perfiles' and column_name = 'visibilidad_personalizada'
  ) then
    raise exception 'el rollback dejó la columna';
  end if;
end $$;
