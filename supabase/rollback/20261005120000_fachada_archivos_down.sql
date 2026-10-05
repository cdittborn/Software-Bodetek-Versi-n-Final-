drop table if exists public.fachada_archivos cascade;

comment on column public.fachadas.foto_key is
  'Key R2 de la foto general: fachadas/{id}/general/…';
