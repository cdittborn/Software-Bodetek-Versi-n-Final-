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

-- Permisos de módulos por rol
-- admin y pablo: ver y editar los 6 módulos
insert into public.modulo_permisos (rol, modulo, puede_ver, puede_editar)
select r.rol, m.modulo, true, true
from (values ('admin'), ('pablo')) as r (rol)
cross join (
  values ('rentas'), ('trabajos'), ('ggcc'), ('legal'), ('usuarios'), ('recintos')
) as m (modulo)
on conflict (rol, modulo) do update
set
  puede_ver = excluded.puede_ver,
  puede_editar = excluded.puede_editar;

-- asistente: ver y editar trabajos; recintos solo lectura
insert into public.modulo_permisos (rol, modulo, puede_ver, puede_editar)
values
  ('asistente', 'trabajos', true, true),
  ('asistente', 'recintos', true, false)
on conflict (rol, modulo) do update
set
  puede_ver = excluded.puede_ver,
  puede_editar = excluded.puede_editar;

-- socio y cliente: ver trabajos, sin editar
insert into public.modulo_permisos (rol, modulo, puede_ver, puede_editar)
values
  ('socio', 'trabajos', true, false),
  ('cliente', 'trabajos', true, false)
on conflict (rol, modulo) do update
set
  puede_ver = excluded.puede_ver,
  puede_editar = excluded.puede_editar;
