-- Prueba LOCAL de 20261103230000_menu_categorias. Nunca contra producción.
-- Crea una copia mínima del esquema (mismas llaves, funciones y políticas que
-- prod), carga las 7 categorías y 17 subcategorías reales con trabajos de
-- relleno, aplica la migración con el mismo script de prod y prueba cada caso.
-- Uso: scripts/probar-menu-categorias-local.sh
\set ON_ERROR_STOP 1
\set QUIET 1

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
end $$;

create schema auth;
create function auth.uid() returns uuid language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to authenticated, anon;

create schema supabase_migrations;
create table supabase_migrations.schema_migrations (
  version text primary key, name text, statements text[]
);

create table public.perfiles (id uuid primary key, rol text not null);
create table public.trabajo_categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  created_at timestamptz not null default now(),
  owner_id uuid references public.perfiles (id)
);
create table public.trabajo_subtipos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.trabajo_categorias (id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);
create table public.trabajos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references public.trabajo_categorias (id),
  subtipo_id uuid references public.trabajo_subtipos (id)
);
create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  subtipo_id uuid not null references public.trabajo_subtipos (id) on delete restrict
);

create function public.mi_rol() returns text language sql stable security definer
set search_path to 'public' as $$ select rol from public.perfiles where id = auth.uid() $$;
create function public.puedo_ver_categoria(p_categoria_id uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.trabajo_categorias as c
    where c.id = p_categoria_id and (c.owner_id is null or c.owner_id = auth.uid()));
$$;

alter table public.trabajo_categorias enable row level security;
alter table public.trabajo_subtipos enable row level security;
alter table public.trabajos enable row level security;
alter table public.eventos enable row level security;

create policy "Delete trabajo_categorias publicas o propias" on public.trabajo_categorias for delete to authenticated
  using (((owner_id is null) and (mi_rol() = any (array['admin', 'pablo']))) or (owner_id = auth.uid()));
create policy "Insert trabajo_categorias publicas o propias" on public.trabajo_categorias for insert to authenticated
  with check (((owner_id is null) and (mi_rol() = any (array['admin', 'pablo', 'asistente']))) or (owner_id = auth.uid()));
create policy "Select trabajo_categorias publicas o propias" on public.trabajo_categorias for select to authenticated
  using (((owner_id is null) and (mi_rol() = any (array['admin', 'pablo', 'asistente', 'socio', 'cliente']))) or (owner_id = auth.uid()));
create policy "Update trabajo_categorias publicas o propias" on public.trabajo_categorias for update to authenticated
  using (((owner_id is null) and (mi_rol() = any (array['admin', 'pablo', 'asistente']))) or (owner_id = auth.uid()))
  with check (((owner_id is null) and (mi_rol() = any (array['admin', 'pablo', 'asistente']))) or (owner_id = auth.uid()));
create policy "Delete trabajo_subtipos por categoria visible" on public.trabajo_subtipos for delete to authenticated
  using (puedo_ver_categoria(categoria_id));
create policy "Insert trabajo_subtipos por categoria visible" on public.trabajo_subtipos for insert to authenticated
  with check (puedo_ver_categoria(categoria_id));
create policy "Select trabajo_subtipos por categoria visible" on public.trabajo_subtipos for select to authenticated
  using (puedo_ver_categoria(categoria_id));
create policy "Update trabajo_subtipos por categoria visible" on public.trabajo_subtipos for update to authenticated
  using (puedo_ver_categoria(categoria_id)) with check (puedo_ver_categoria(categoria_id));
create policy "Select trabajos" on public.trabajos for select to authenticated using (true);
create policy "Select eventos" on public.eventos for select to authenticated using (true);

grant usage on schema public to authenticated, anon;
grant all on all tables in schema public to authenticated, anon;

insert into public.perfiles values
  ('00000000-0000-0000-0000-0000000000a1', 'admin'),
  ('00000000-0000-0000-0000-0000000000b2', 'pablo'),
  ('00000000-0000-0000-0000-0000000000c3', 'socio');

insert into public.trabajo_categorias (id,nombre,owner_id) values ('6610bbfd-cdbf-4090-a5ec-8679e76795da','Imagen',null);
insert into public.trabajo_categorias (id,nombre,owner_id) values ('3a28017c-f50c-43ed-a6a0-7cf32fb918ec','Seguridad',null);
insert into public.trabajo_categorias (id,nombre,owner_id) values ('34706292-7367-49bd-a6ed-5317d92847cc','Protocolos',null);
insert into public.trabajo_categorias (id,nombre,owner_id) values ('ba85ed4a-cf21-44a2-959e-712c6bf440fc','Otros',null);
insert into public.trabajo_categorias (id,nombre,owner_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','Techumbres y canales',null);
insert into public.trabajo_categorias (id,nombre,owner_id) values ('08b48e08-152d-491f-b6a0-a566dc040d05','Patentes',null);
insert into public.trabajo_categorias (id,nombre,owner_id) values ('c0b45b99-6d0e-45be-b21e-83fe323047f0','Otros trabajos CD','00000000-0000-0000-0000-0000000000a1');
insert into public.trabajo_subtipos (id,nombre,categoria_id) values ('592cf172-fe6b-4a9c-b27f-c0d2bf850171','Pórtico de entrada','6610bbfd-cdbf-4090-a5ec-8679e76795da');
insert into public.trabajo_subtipos (id,nombre,categoria_id) values ('c9151185-fff3-4d15-ab33-57a6c07da453','Letreros de locales','6610bbfd-cdbf-4090-a5ec-8679e76795da');
insert into public.trabajo_subtipos (id,nombre,categoria_id) values ('58af02ea-84d4-4ec1-b537-3f7bad8f33cf','Fachadas','6610bbfd-cdbf-4090-a5ec-8679e76795da');
insert into public.trabajo_subtipos (id,nombre,categoria_id) values ('9595d715-d7eb-4c0d-85d7-cfea3168b600','Lluvias y temporales','8fc81213-50bb-4403-ae8c-f6a2902059c4');
insert into public.trabajo_subtipos (id,nombre,categoria_id) values ('e8e0030d-2f2c-4b38-9c98-c3b0300448ef','Clientes con patentes en proceso','08b48e08-152d-491f-b6a0-a566dc040d05');
insert into public.trabajo_subtipos (id,nombre,categoria_id) values ('fe76839f-1d1f-4b88-bc1b-31ebc9e5b2da','Proyecto recepción de obras','08b48e08-152d-491f-b6a0-a566dc040d05');
insert into public.trabajo_subtipos (id,nombre,categoria_id) values ('1d45e4d6-a687-4d4d-ae0b-8a5531fc88bb','Revisiones y mantenciones periódicas','8fc81213-50bb-4403-ae8c-f6a2902059c4');
insert into public.trabajo_subtipos (id,nombre,categoria_id) values ('345414e1-c8dc-4178-9011-81c563176d56','Bodetek','c0b45b99-6d0e-45be-b21e-83fe323047f0');
insert into public.trabajo_subtipos (id,nombre,categoria_id) values ('6bac46d4-44dd-4d22-84ee-c315acf9d1db','Hacienda Los Aromos','c0b45b99-6d0e-45be-b21e-83fe323047f0');
insert into public.trabajo_subtipos (id,nombre,categoria_id) values ('65d371c1-cea7-4819-910d-166a5024df7a','Vías - Condominio Vicuña','c0b45b99-6d0e-45be-b21e-83fe323047f0');
insert into public.trabajo_subtipos (id,nombre,categoria_id) values ('c58d7702-8fb9-4b97-b52c-a2f9306109e1','Grupo BD','c0b45b99-6d0e-45be-b21e-83fe323047f0');
insert into public.trabajo_subtipos (id,nombre,categoria_id) values ('a5dda1c5-73fa-4535-8ec4-1adca99662a2','Premios Chile Naturaleza','c0b45b99-6d0e-45be-b21e-83fe323047f0');
insert into public.trabajo_subtipos (id,nombre,categoria_id) values ('1f3e6774-f789-417b-9875-944a4ca45b54','Parque Imaginario','c0b45b99-6d0e-45be-b21e-83fe323047f0');
insert into public.trabajo_subtipos (id,nombre,categoria_id) values ('b1d3a0df-d6cb-4e6e-ba2e-6b21f2033588','Personales','c0b45b99-6d0e-45be-b21e-83fe323047f0');
insert into public.trabajo_subtipos (id,nombre,categoria_id) values ('ea78891a-766e-4faf-86b2-9f6902e58c9f','Viaje','c0b45b99-6d0e-45be-b21e-83fe323047f0');
insert into public.trabajo_subtipos (id,nombre,categoria_id) values ('840ee87b-5262-43c0-bda8-0633444771ce','Otros','c0b45b99-6d0e-45be-b21e-83fe323047f0');
insert into public.trabajo_subtipos (id,nombre,categoria_id) values ('07911151-bb40-4e45-9a77-33a42f8cfb0d','Administración de propiedades','c0b45b99-6d0e-45be-b21e-83fe323047f0');
insert into public.trabajos (categoria_id,subtipo_id) values ('08b48e08-152d-491f-b6a0-a566dc040d05','e8e0030d-2f2c-4b38-9c98-c3b0300448ef');
insert into public.trabajos (categoria_id,subtipo_id) values ('c0b45b99-6d0e-45be-b21e-83fe323047f0','345414e1-c8dc-4178-9011-81c563176d56');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('c0b45b99-6d0e-45be-b21e-83fe323047f0','6bac46d4-44dd-4d22-84ee-c315acf9d1db');
insert into public.trabajos (categoria_id,subtipo_id) values ('c0b45b99-6d0e-45be-b21e-83fe323047f0','b1d3a0df-d6cb-4e6e-ba2e-6b21f2033588');
insert into public.trabajos (categoria_id,subtipo_id) values ('c0b45b99-6d0e-45be-b21e-83fe323047f0','07911151-bb40-4e45-9a77-33a42f8cfb0d');
insert into public.trabajos (categoria_id,subtipo_id) values ('c0b45b99-6d0e-45be-b21e-83fe323047f0','345414e1-c8dc-4178-9011-81c563176d56');
insert into public.trabajos (categoria_id,subtipo_id) values ('c0b45b99-6d0e-45be-b21e-83fe323047f0','345414e1-c8dc-4178-9011-81c563176d56');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('c0b45b99-6d0e-45be-b21e-83fe323047f0','b1d3a0df-d6cb-4e6e-ba2e-6b21f2033588');
insert into public.trabajos (categoria_id,subtipo_id) values ('c0b45b99-6d0e-45be-b21e-83fe323047f0','6bac46d4-44dd-4d22-84ee-c315acf9d1db');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('c0b45b99-6d0e-45be-b21e-83fe323047f0','345414e1-c8dc-4178-9011-81c563176d56');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('c0b45b99-6d0e-45be-b21e-83fe323047f0','6bac46d4-44dd-4d22-84ee-c315acf9d1db');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('c0b45b99-6d0e-45be-b21e-83fe323047f0','345414e1-c8dc-4178-9011-81c563176d56');
insert into public.trabajos (categoria_id,subtipo_id) values ('c0b45b99-6d0e-45be-b21e-83fe323047f0','6bac46d4-44dd-4d22-84ee-c315acf9d1db');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.trabajos (categoria_id,subtipo_id) values ('8fc81213-50bb-4403-ae8c-f6a2902059c4','9595d715-d7eb-4c0d-85d7-cfea3168b600');
insert into public.eventos (subtipo_id) values ('9595d715-d7eb-4c0d-85d7-cfea3168b600');

-- Aplicar con el mismo script que se usaría en prod, y verificar.
\ir aplicar-menu-categorias-commit.sql
\ir verificar-menu-categorias.sql
set default_transaction_read_only = off;

create function public.t_espera_error(sql text, patron text) returns void
language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    if sqlerrm !~* patron then
      raise exception 'Error inesperado en [%]: %', sql, sqlerrm;
    end if;
    raise notice 'OK, bloqueado: %', sqlerrm;
    return;
  end;
  raise exception 'NO se bloqueó: %', sql;
end $$;
create function public.t_igual(desc_ text, actual anyelement, esperado anyelement) returns void
language plpgsql as $$
begin
  if actual is distinct from esperado then
    raise exception 'FALLA %: % (esperado %)', desc_, actual, esperado;
  end if;
  raise notice 'OK, %', desc_;
end $$;
grant execute on function public.t_espera_error(text, text), public.t_igual(text, anyelement, anyelement) to authenticated, anon;

\echo '--- Pablo: bloqueos'
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', false);

select t_igual('Pablo ve 6 categorías (no Otros trabajos CD)', (select count(*) from trabajo_categorias), 6::bigint);
select t_espera_error($$delete from trabajo_subtipos where id = '9595d715-d7eb-4c0d-85d7-cfea3168b600'$$, 'protegida');
select t_espera_error($$delete from trabajo_subtipos where id = '58af02ea-84d4-4ec1-b537-3f7bad8f33cf'$$, 'protegida');
select t_espera_error($$delete from trabajo_categorias where id = '6610bbfd-cdbf-4090-a5ec-8679e76795da'$$, 'protegida');
select t_espera_error($$delete from trabajo_categorias where id = '8fc81213-50bb-4403-ae8c-f6a2902059c4'$$, 'protegida');
select t_espera_error($$delete from trabajo_categorias where id = '08b48e08-152d-491f-b6a0-a566dc040d05'$$, 'protegida');
select t_espera_error($$update trabajo_subtipos set protegida = false where id = '9595d715-d7eb-4c0d-85d7-cfea3168b600'$$, 'no se cambian');
select t_espera_error($$update trabajo_categorias set protegida = false where id = '6610bbfd-cdbf-4090-a5ec-8679e76795da'$$, 'no se cambian');
select t_espera_error($$update trabajo_categorias set clave = 'x' where id = '3a28017c-f50c-43ed-a6a0-7cf32fb918ec'$$, 'no se cambian');
select t_espera_error($$update trabajo_categorias set owner_id = auth.uid() where id = '3a28017c-f50c-43ed-a6a0-7cf32fb918ec'$$, 'no se cambian');
select t_espera_error($$update trabajo_subtipos set categoria_id = '3a28017c-f50c-43ed-a6a0-7cf32fb918ec' where id = 'c9151185-fff3-4d15-ab33-57a6c07da453'$$, 'no se cambian');
select t_espera_error($$insert into trabajo_categorias (nombre, protegida) values ('X', true)$$, 'no puede venir');
select t_espera_error($$update trabajo_categorias set color = '#FF0000' where id = '3a28017c-f50c-43ed-a6a0-7cf32fb918ec'$$, 'color_paleta');
select t_espera_error($$select guardar_menu_categorias('{"categorias": [], "eliminar_subtipos": ["9595d715-d7eb-4c0d-85d7-cfea3168b600"]}')$$, 'protegida');
select t_espera_error($$select guardar_menu_categorias('{"categorias": [], "eliminar_subtipos": ["ea78891a-766e-4faf-86b2-9f6902e58c9f"]}')$$, 'no es visible');
select t_espera_error($$select guardar_menu_categorias('{"categorias": [{"id": null, "nombre": "   "}]}')$$, 'entre 1 y 80');

\echo '--- Subcategoría con un trabajo: no se borra'
reset role;
insert into trabajos (subtipo_id, categoria_id) values ('c9151185-fff3-4d15-ab33-57a6c07da453', '6610bbfd-cdbf-4090-a5ec-8679e76795da');
set role authenticated;
select t_espera_error($$delete from trabajo_subtipos where id = 'c9151185-fff3-4d15-ab33-57a6c07da453'$$, 'Tiene 1 trabajos');
reset role;
insert into trabajo_categorias (id, nombre) values ('00000000-0000-0000-0000-00000000d001', 'Con trabajo');
insert into trabajo_subtipos (id, categoria_id, nombre) values ('00000000-0000-0000-0000-00000000d002', '00000000-0000-0000-0000-00000000d001', 'Sub con trabajo');
insert into trabajos (subtipo_id) values ('00000000-0000-0000-0000-00000000d002');
set role authenticated;
select t_espera_error($$delete from trabajo_categorias where id = '00000000-0000-0000-0000-00000000d001'$$, 'Tiene 1 trabajos');
reset role;
delete from trabajos where subtipo_id in ('c9151185-fff3-4d15-ab33-57a6c07da453', '00000000-0000-0000-0000-00000000d002');
delete from trabajo_categorias where id = '00000000-0000-0000-0000-00000000d001';

\echo '--- Pablo: guardar el menú (todo en un paso)'
set role authenticated;
begin;
select guardar_menu_categorias($j${
  "categorias": [
    {"id": "08b48e08-152d-491f-b6a0-a566dc040d05", "nombre": "Patentes", "color": "#4E9E92", "subtipos": [
      {"id": "fe76839f-1d1f-4b88-bc1b-31ebc9e5b2da", "nombre": "Proyecto recepción de obras"},
      {"id": "e8e0030d-2f2c-4b38-9c98-c3b0300448ef", "nombre": "Clientes con patentes"}
    ]},
    {"id": "8fc81213-50bb-4403-ae8c-f6a2902059c4", "nombre": "Techumbres y canales", "color": "#C7707D", "subtipos": [
      {"id": "9595d715-d7eb-4c0d-85d7-cfea3168b600", "nombre": "Lluvias"},
      {"id": "1d45e4d6-a687-4d4d-ae0b-8a5531fc88bb", "nombre": "Revisiones y mantenciones periódicas"}
    ]},
    {"id": "6610bbfd-cdbf-4090-a5ec-8679e76795da", "nombre": "Imagen", "color": "#9682CF", "subtipos": [
      {"id": "58af02ea-84d4-4ec1-b537-3f7bad8f33cf", "nombre": "Fachadas"},
      {"id": "c9151185-fff3-4d15-ab33-57a6c07da453", "nombre": "Letreros de locales"}
    ]},
    {"id": "34706292-7367-49bd-a6ed-5317d92847cc", "nombre": "Protocolos", "color": "#C9973F", "subtipos": []},
    {"id": "ba85ed4a-cf21-44a2-959e-712c6bf440fc", "nombre": "Otros", "color": "#8A90A0", "subtipos": []},
    {"id": null, "nombre": " Prueba ", "color": "#5E9E70", "subtipos": [{"id": null, "nombre": "Sub prueba"}]}
  ],
  "eliminar_subtipos": ["592cf172-fe6b-4a9c-b27f-c0d2bf850171"],
  "eliminar_categorias": ["3a28017c-f50c-43ed-a6a0-7cf32fb918ec"]
}$j$);
reset role;
select t_igual('Lluvias renombrada, misma fila y clave', (select nombre || '|' || clave || '|' || orden from trabajo_subtipos where id = '9595d715-d7eb-4c0d-85d7-cfea3168b600'), 'Lluvias|lluvias_temporales|1');
select t_igual('Patentes pasó a primera', (select orden from trabajo_categorias where id = '08b48e08-152d-491f-b6a0-a566dc040d05'), 1);
select t_igual('Color de Techumbres cambiado', (select color from trabajo_categorias where id = '8fc81213-50bb-4403-ae8c-f6a2902059c4'), '#C7707D');
select t_igual('Categoría nueva sin espacios, orden 6', (select nombre || '|' || orden || '|' || protegida from trabajo_categorias where nombre = 'Prueba'), 'Prueba|6|false');
select t_igual('Subcategoría nueva dentro de Prueba', (select count(*) from trabajo_subtipos s join trabajo_categorias c on c.id = s.categoria_id where c.nombre = 'Prueba' and s.nombre = 'Sub prueba'), 1::bigint);
select t_igual('Seguridad eliminada', (select count(*) from trabajo_categorias where id = '3a28017c-f50c-43ed-a6a0-7cf32fb918ec'), 0::bigint);
select t_igual('Pórtico eliminado', (select count(*) from trabajo_subtipos where id = '592cf172-fe6b-4a9c-b27f-c0d2bf850171'), 0::bigint);
select t_igual('Otros trabajos CD intacta', (select nombre || '|' || orden || '|' || archivada from trabajo_categorias where id = 'c0b45b99-6d0e-45be-b21e-83fe323047f0'), 'Otros trabajos CD|7|true');
select t_igual('Trabajos intactos', (select count(*) from trabajos), 42::bigint);
rollback;

\echo '--- Guardar es todo o nada'
set role authenticated;
select t_espera_error($$select guardar_menu_categorias('{"categorias": [{"id": "6610bbfd-cdbf-4090-a5ec-8679e76795da", "nombre": "Imagen nueva", "color": "#9682CF", "subtipos": []}], "eliminar_subtipos": ["9595d715-d7eb-4c0d-85d7-cfea3168b600"]}')$$, 'protegida');
select t_igual('Nada cambió tras el error', (select nombre from trabajo_categorias where id = '6610bbfd-cdbf-4090-a5ec-8679e76795da'), 'Imagen');

\echo '--- Borrar categoría con subcategorías vacías arrastra solo esas'
begin;
select guardar_menu_categorias('{"categorias": [{"id": null, "nombre": "Temporal", "color": "#5E87D6", "subtipos": [{"id": null, "nombre": "A"}, {"id": null, "nombre": "B"}]}]}');
select guardar_menu_categorias(format('{"categorias": [], "eliminar_categorias": ["%s"]}', (select id from trabajo_categorias where nombre = 'Temporal'))::jsonb);
select t_igual('Temporal y sus 2 subcategorías se fueron', (select count(*) from trabajo_subtipos where nombre in ('A', 'B')), 0::bigint);
rollback;

\echo '--- Socio: no edita'
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c3', false);
select t_igual('Socio ve 6 categorías', (select count(*) from trabajo_categorias), 6::bigint);
select t_espera_error($$select guardar_menu_categorias('{"categorias": []}')$$, 'Solo admin y Pablo');
select t_espera_error($$insert into trabajo_categorias (nombre) values ('Del socio')$$, 'row-level security');
select t_espera_error($$insert into trabajo_subtipos (categoria_id, nombre) values ('34706292-7367-49bd-a6ed-5317d92847cc', 'Del socio')$$, 'row-level security');
update trabajo_subtipos set nombre = 'Cambiado por socio' where id = 'c9151185-fff3-4d15-ab33-57a6c07da453';
delete from trabajo_subtipos where id = 'c9151185-fff3-4d15-ab33-57a6c07da453';
reset role;
select t_igual('Socio no pudo renombrar ni borrar', (select nombre from trabajo_subtipos where id = 'c9151185-fff3-4d15-ab33-57a6c07da453'), 'Letreros de locales');

\echo '--- Anónimo: no edita'
set role anon;
select t_espera_error($$select guardar_menu_categorias('{"categorias": []}')$$, 'permission denied');
reset role;

\echo '--- Admin dueño de Otros trabajos CD: archivada no se toca'
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
select t_igual('Admin sigue viendo sus 7 categorías', (select count(*) from trabajo_categorias), 7::bigint);
select t_espera_error($$update trabajo_categorias set nombre = 'X' where id = 'c0b45b99-6d0e-45be-b21e-83fe323047f0'$$, 'archivada');
select t_espera_error($$delete from trabajo_subtipos where id = 'ea78891a-766e-4faf-86b2-9f6902e58c9f'$$, 'archivada');
select t_espera_error($$insert into trabajo_subtipos (categoria_id, nombre) values ('c0b45b99-6d0e-45be-b21e-83fe323047f0', 'Nueva')$$, 'archivada');
select t_espera_error($$delete from trabajo_categorias where id = 'c0b45b99-6d0e-45be-b21e-83fe323047f0'$$, 'archivada');
reset role;

\echo '--- Rollback y reaplicación'
drop function public.t_espera_error(text, text);
drop function public.t_igual(text, anyelement, anyelement);
\ir aplicar-menu-categorias-rollback.sql
select t_count from (select count(*) as t_count from information_schema.columns
  where table_schema = 'public' and table_name in ('trabajo_categorias', 'trabajo_subtipos')
    and column_name in ('orden', 'color', 'clave', 'protegida', 'archivada')) x;
select count(*) as politicas_tras_rollback from pg_policies where tablename in ('trabajo_categorias', 'trabajo_subtipos');
\ir aplicar-menu-categorias-commit.sql
\ir verificar-menu-categorias.sql
\echo 'TODAS LAS PRUEBAS PASARON'
