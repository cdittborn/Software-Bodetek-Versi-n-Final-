-- Datos iniciales del Módulo 2: categorías y subtipos de Imagen
insert into public.trabajo_categorias (nombre)
values
  ('Imagen'),
  ('Seguridad'),
  ('Protocolos'),
  ('Otros')
on conflict (nombre) do nothing;

insert into public.trabajo_subtipos (categoria_id, nombre)
select c.id, s.nombre
from public.trabajo_categorias as c
cross join (
  values
    ('Pórtico de entrada'),
    ('Letreros de locales'),
    ('Fachadas')
) as s (nombre)
where c.nombre = 'Imagen'
on conflict (categoria_id, nombre) do nothing;
