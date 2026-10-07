-- Versión por recinto para que un guardado no pise otro.
-- No borra textos, archivos ni validaciones ya guardadas.
-- No toca trabajo_media, las notas de la ficha, el encabezado ni el vencimiento.
-- No aplicar en producción sin OK explícito.

alter table public.informe_seguro_recintos
  add column version integer not null default 1,
  add constraint informe_seguro_recintos_version_check check (version >= 1);

comment on column public.informe_seguro_recintos.version is
  'Sube 1 cada vez que se guarda este recinto. La pantalla la manda de vuelta para no pisar otro guardado.';

create or replace function public.guardar_borrador_informe_seguro(
  p_evento_id uuid,
  p_token text,
  p_recintos jsonb,
  p_subproyectos jsonb,
  p_media jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
  v_token text;
  v_activo boolean;
  v_nuevos bigint;
  v_insertados bigint;
begin
  if public.mi_rol() is distinct from 'admin' and public.mi_rol() is distinct from 'pablo' then
    raise exception 'Solo admin y pablo pueden editar el informe.' using errcode = '42501';
  end if;

  if p_token is null or char_length(p_token) < 32 then
    raise exception 'El token del informe no es válido.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_recintos, '[]'::jsonb)) as elem
    where not (elem ? 'version')
  ) then
    raise exception 'Falta la versión del recinto. No escribí nada en la base.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(coalesce(p_recintos, '[]'::jsonb)) as p(trabajo_id uuid)
    where p.trabajo_id is null
  ) then
    raise exception 'El recinto del guardado no es válido. No escribí nada en la base.';
  end if;

  if (
    select count(*)
    from jsonb_to_recordset(coalesce(p_recintos, '[]'::jsonb)) as p(trabajo_id uuid)
  ) is distinct from (
    select count(distinct p.trabajo_id)
    from jsonb_to_recordset(coalesce(p_recintos, '[]'::jsonb)) as p(trabajo_id uuid)
  ) then
    raise exception 'Hay un recinto repetido en el guardado. No escribí nada en la base.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(coalesce(p_subproyectos, '[]'::jsonb)) as s(trabajo_id uuid)
    where not exists (
      select 1
      from jsonb_to_recordset(coalesce(p_recintos, '[]'::jsonb)) as p(trabajo_id uuid)
      where p.trabajo_id = s.trabajo_id
    )
  ) or exists (
    select 1
    from jsonb_to_recordset(coalesce(p_media, '[]'::jsonb)) as m(trabajo_id uuid)
    where not exists (
      select 1
      from jsonb_to_recordset(coalesce(p_recintos, '[]'::jsonb)) as p(trabajo_id uuid)
      where p.trabajo_id = m.trabajo_id
    )
  ) then
    raise exception 'El guardado trae datos de un recinto que no va a actualizar. No escribí nada en la base.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(coalesce(p_recintos, '[]'::jsonb))
      as r(trabajo_id uuid, descripcion_validada boolean)
    where r.descripcion_validada is true
      and not exists (
        select 1
        from jsonb_to_recordset(coalesce(p_subproyectos, '[]'::jsonb))
          as s(trabajo_id uuid, descripcion_seguro text)
        where s.trabajo_id = r.trabajo_id
          and length(btrim(coalesce(s.descripcion_seguro, ''))) > 0
      )
  ) then
    raise exception 'Para validar un recinto, pasa al menos un texto al informe.';
  end if;

  if jsonb_array_length(coalesce(p_recintos, '[]'::jsonb)) = 0 then
    select id, token, token_activo
      into v_id, v_token, v_activo
    from public.informes_seguro
    where evento_id = p_evento_id;

    return jsonb_build_object(
      'token', v_token,
      'token_activo', coalesce(v_activo, false),
      'recintos', '[]'::jsonb
    );
  end if;

  select id, token, token_activo
    into v_id, v_token, v_activo
  from public.informes_seguro
  where evento_id = p_evento_id;

  if v_id is null then
    insert into public.informes_seguro (evento_id, token, token_activo, created_by)
    values (p_evento_id, p_token, false, auth.uid())
    on conflict (evento_id) do nothing
    returning id, token, token_activo into v_id, v_token, v_activo;

    if v_id is null then
      select id, token, token_activo
        into v_id, v_token, v_activo
      from public.informes_seguro
      where evento_id = p_evento_id;
    end if;
  end if;

  perform 1
  from public.informe_seguro_recintos r
  where r.informe_id = v_id
    and r.trabajo_id in (
      select p.trabajo_id
      from jsonb_to_recordset(p_recintos) as p(trabajo_id uuid)
    )
  order by r.trabajo_id
  for update;

  if exists (
    select 1
    from jsonb_to_recordset(p_recintos) as p(trabajo_id uuid, version integer)
    left join public.informe_seguro_recintos r
      on r.informe_id = v_id
     and r.trabajo_id = p.trabajo_id
    where (p.version is null and r.trabajo_id is not null)
       or (p.version is not null and (r.trabajo_id is null or r.version is distinct from p.version))
  ) then
    raise exception 'Este informe se guardó desde otra pestaña o dispositivo. Recarga para ver lo último antes de seguir.'
      using errcode = 'P0001';
  end if;

  delete from public.informe_seguro_media m
  using jsonb_to_recordset(p_recintos) as p(trabajo_id uuid)
  where m.informe_id = v_id
    and m.trabajo_id = p.trabajo_id;

  delete from public.informe_seguro_subproyectos s
  using jsonb_to_recordset(p_recintos) as p(trabajo_id uuid)
  where s.informe_id = v_id
    and s.trabajo_id = p.trabajo_id;

  update public.informe_seguro_recintos as r
  set
    incluido = coalesce(p.incluido, true),
    descripcion_seguro = btrim(coalesce(p.descripcion_seguro, '')),
    descripcion_validada = coalesce(p.descripcion_validada, false),
    validada_at = case
      when coalesce(p.descripcion_validada, false) and r.descripcion_validada then r.validada_at
      when coalesce(p.descripcion_validada, false) then now()
      else null
    end,
    validada_por = case
      when coalesce(p.descripcion_validada, false) and r.descripcion_validada then r.validada_por
      when coalesce(p.descripcion_validada, false) then auth.uid()
      else null
    end,
    version = r.version + 1
  from jsonb_to_recordset(p_recintos)
    as p(
      trabajo_id uuid,
      incluido boolean,
      descripcion_seguro text,
      descripcion_validada boolean,
      version integer
    )
  where r.informe_id = v_id
    and r.trabajo_id = p.trabajo_id
    and p.version is not null;

  select count(*)
    into v_nuevos
  from jsonb_to_recordset(p_recintos) as p(version integer)
  where p.version is null;

  insert into public.informe_seguro_recintos (
    informe_id, trabajo_id, incluido, descripcion_seguro,
    descripcion_validada, validada_at, validada_por, version
  )
  select
    v_id,
    p.trabajo_id,
    coalesce(p.incluido, true),
    btrim(coalesce(p.descripcion_seguro, '')),
    coalesce(p.descripcion_validada, false),
    case when coalesce(p.descripcion_validada, false) then now() else null end,
    case when coalesce(p.descripcion_validada, false) then auth.uid() else null end,
    1
  from jsonb_to_recordset(p_recintos)
    as p(
      trabajo_id uuid,
      incluido boolean,
      descripcion_seguro text,
      descripcion_validada boolean,
      version integer
    )
  where p.version is null
  on conflict (informe_id, trabajo_id) do nothing;

  get diagnostics v_insertados = row_count;
  if v_insertados < v_nuevos then
    raise exception 'Este informe se guardó desde otra pestaña o dispositivo. Recarga para ver lo último antes de seguir.'
      using errcode = 'P0001';
  end if;

  insert into public.informe_seguro_subproyectos (
    informe_id, trabajo_id, tipo_problema, incluido, descripcion_seguro
  )
  select
    v_id,
    s.trabajo_id,
    s.tipo_problema,
    coalesce(s.incluido, true),
    btrim(coalesce(s.descripcion_seguro, ''))
  from jsonb_to_recordset(coalesce(p_subproyectos, '[]'::jsonb))
    as s(
      trabajo_id uuid,
      tipo_problema text,
      incluido boolean,
      descripcion_seguro text
    );

  insert into public.informe_seguro_media (
    informe_id, trabajo_media_id, trabajo_id, tipo_problema, incluido, orden, es_portada
  )
  select
    v_id,
    m.trabajo_media_id,
    m.trabajo_id,
    m.tipo_problema,
    coalesce(m.incluido, false),
    coalesce(m.orden, 0),
    coalesce(m.es_portada, false)
  from jsonb_to_recordset(coalesce(p_media, '[]'::jsonb))
    as m(
      trabajo_media_id uuid,
      trabajo_id uuid,
      tipo_problema text,
      incluido boolean,
      orden integer,
      es_portada boolean
    );

  return jsonb_build_object(
    'token', v_token,
    'token_activo', v_activo,
    'recintos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'trabajo_id', r.trabajo_id,
        'version', r.version
      ) order by r.trabajo_id)
      from public.informe_seguro_recintos r
      where r.informe_id = v_id
        and r.trabajo_id in (
          select p.trabajo_id
          from jsonb_to_recordset(p_recintos) as p(trabajo_id uuid)
        )
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.guardar_borrador_informe_seguro(uuid, text, jsonb, jsonb, jsonb) from public;
revoke all on function public.guardar_borrador_informe_seguro(uuid, text, jsonb, jsonb, jsonb) from anon;
revoke all on function public.guardar_borrador_informe_seguro(uuid, text, jsonb, jsonb, jsonb) from authenticated;
grant execute on function public.guardar_borrador_informe_seguro(uuid, text, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.guardar_borrador_informe_seguro(uuid, text, jsonb, jsonb, jsonb) to service_role;

comment on function public.guardar_borrador_informe_seguro(uuid, text, jsonb, jsonb, jsonb) is
  'Guarda solo los recintos del payload. Si la versión no coincide, no escribe nada.';
