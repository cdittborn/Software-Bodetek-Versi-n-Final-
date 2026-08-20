-- Fecha estimada de entrega para Filtración-Proyecto (Lluvias).
-- Distinta de fecha_termino (entrega real en Patentes / recepción de obras).
-- No toca Patentes, Techos, Recintos, Auth ni Otros trabajos CD.

alter table public.trabajos
  add column if not exists fecha_entrega_estimada date;

comment on column public.trabajos.fecha_entrega_estimada is
  'Fecha estimada de entrega (Lluvias / Filtración-Proyecto). Distinta de fecha_termino (entrega real en Patentes).';
