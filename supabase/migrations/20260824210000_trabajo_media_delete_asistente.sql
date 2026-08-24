-- Alinear DELETE en trabajo_media con INSERT: asistente puede borrar en categorías no privadas.

drop policy if exists "Delete trabajo_media por acceso a trabajo o inbox"
  on public.trabajo_media;

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
