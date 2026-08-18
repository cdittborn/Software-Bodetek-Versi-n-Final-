-- Crea automáticamente un perfil al registrar un usuario en Auth.
-- Nota: la columna en public.perfiles se llama "nombre" (no nombre_completo).
-- El metadata usa la clave "nombre_completo" y se guarda en perfiles.nombre.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre text;
  v_rol text;
begin
  v_nombre := nullif(trim(coalesce(new.raw_user_meta_data->>'nombre_completo', '')), '');
  if v_nombre is null then
    v_nombre := new.email;
  end if;

  v_rol := nullif(trim(coalesce(new.raw_user_meta_data->>'rol', '')), '');
  if v_rol is null or v_rol not in ('admin', 'pablo', 'asistente', 'socio', 'cliente') then
    v_rol := 'cliente';
  end if;

  insert into public.perfiles (id, nombre, rol)
  values (new.id, v_nombre, v_rol)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

comment on function public.handle_new_user() is
  'Crea fila en public.perfiles al insertar usuario en auth.users';
