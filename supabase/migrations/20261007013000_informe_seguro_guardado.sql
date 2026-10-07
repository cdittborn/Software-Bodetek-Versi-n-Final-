-- Guardado del informe en una sola transacción.
-- No toca trabajo_media, las notas de la ficha ni el encabezado
-- (nombre, póliza, siniestro, contacto, dirección, fechas).
-- No escribe vencimiento. La columna queda y no se usa.
-- No aplicar en producción sin OK explícito.

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
  v_prev jsonb;
begin
  if public.mi_rol() is distinct from 'admin' and public.mi_rol() is distinct from 'pablo' then
    raise exception 'Solo admin y pablo pueden editar el informe.' using errcode = '42501';
  end if;

  if p_token is null or char_length(p_token) < 32 then
    raise exception 'El token del informe no es válido.';
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

  select id, token, token_activo
    into v_id, v_token, v_activo
  from public.informes_seguro
  where evento_id = p_evento_id;

  if v_id is null then
    insert into public.informes_seguro (evento_id, token, token_activo, created_by)
    values (p_evento_id, p_token, false, auth.uid())
    returning id, token, token_activo into v_id, v_token, v_activo;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'trabajo_id', trabajo_id,
        'descripcion_validada', descripcion_validada,
        'validada_at', validada_at,
        'validada_por', validada_por
      )
    ),
    '[]'::jsonb
  )
    into v_prev
  from public.informe_seguro_recintos
  where informe_id = v_id;

  delete from public.informe_seguro_media where informe_id = v_id;
  delete from public.informe_seguro_subproyectos where informe_id = v_id;
  delete from public.informe_seguro_recintos where informe_id = v_id;

  insert into public.informe_seguro_recintos (
    informe_id, trabajo_id, incluido, descripcion_seguro,
    descripcion_validada, validada_at, validada_por
  )
  select
    v_id,
    r.trabajo_id,
    coalesce(r.incluido, true),
    btrim(coalesce(r.descripcion_seguro, '')),
    coalesce(r.descripcion_validada, false),
    case
      when coalesce(r.descripcion_validada, false) and coalesce(prev.descripcion_validada, false)
        then prev.validada_at
      when coalesce(r.descripcion_validada, false) then now()
      else null
    end,
    case
      when coalesce(r.descripcion_validada, false) and coalesce(prev.descripcion_validada, false)
        then prev.validada_por
      when coalesce(r.descripcion_validada, false) then auth.uid()
      else null
    end
  from jsonb_to_recordset(coalesce(p_recintos, '[]'::jsonb))
    as r(
      trabajo_id uuid,
      incluido boolean,
      descripcion_seguro text,
      descripcion_validada boolean
    )
  left join jsonb_to_recordset(v_prev)
    as prev(
      trabajo_id uuid,
      descripcion_validada boolean,
      validada_at timestamptz,
      validada_por uuid
    ) on prev.trabajo_id = r.trabajo_id;

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
    'token_activo', v_activo
  );
end;
$$;

revoke all on function public.guardar_borrador_informe_seguro(uuid, text, jsonb, jsonb, jsonb) from public;
revoke all on function public.guardar_borrador_informe_seguro(uuid, text, jsonb, jsonb, jsonb) from anon;
revoke all on function public.guardar_borrador_informe_seguro(uuid, text, jsonb, jsonb, jsonb) from authenticated;
grant execute on function public.guardar_borrador_informe_seguro(uuid, text, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.guardar_borrador_informe_seguro(uuid, text, jsonb, jsonb, jsonb) to service_role;

comment on function public.guardar_borrador_informe_seguro(uuid, text, jsonb, jsonb, jsonb) is
  'Reemplaza el borrador del informe en una transacción. No modifica la ficha, el encabezado ni el vencimiento.';
