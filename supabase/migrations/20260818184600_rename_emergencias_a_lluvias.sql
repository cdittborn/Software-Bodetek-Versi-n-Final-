-- Renombra el subtipo visible en Techumbres y canales.
update public.trabajo_subtipos as s
set nombre = 'Lluvias y temporales'
from public.trabajo_categorias as c
where s.categoria_id = c.id
  and c.nombre = 'Techumbres y canales'
  and s.nombre = 'Emergencias';
