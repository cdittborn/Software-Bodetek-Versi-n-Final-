-- Fechas de último trabajo ANTES de usar el sistema (base para próximas).
-- Aditivo sobre 20260928180000_fachadas_frecuencias_tipo.
-- Null = desconocida o nunca se hizo. No entra en costos, días, m² ni reportes.
-- CHECK con CURRENT_DATE (UTC en Supabase). La app también valida vs hoy Chile.

alter table public.fachadas
  add column ultima_limpieza_fecha date;

alter table public.fachadas
  add column ultima_reparacion_fecha date;

alter table public.fachadas
  add column ultima_pintura_fecha date;

alter table public.fachadas
  add constraint fachadas_ultima_limpieza_fecha_check
  check (ultima_limpieza_fecha is null or ultima_limpieza_fecha <= current_date);

alter table public.fachadas
  add constraint fachadas_ultima_reparacion_fecha_check
  check (ultima_reparacion_fecha is null or ultima_reparacion_fecha <= current_date);

alter table public.fachadas
  add constraint fachadas_ultima_pintura_fecha_check
  check (ultima_pintura_fecha is null or ultima_pintura_fecha <= current_date);

comment on column public.fachadas.ultima_limpieza_fecha is
  'Fecha de la última limpieza ANTES de usar el sistema. Null = desconocida o nunca. No entra en costos/días/m². Solo base para próxima fecha y estado.';

comment on column public.fachadas.ultima_reparacion_fecha is
  'Fecha de la última reparación ANTES de usar el sistema. Null = desconocida o nunca. No entra en costos/días/m². Solo base para próxima fecha y estado.';

comment on column public.fachadas.ultima_pintura_fecha is
  'Fecha de la última pintura ANTES de usar el sistema. Null = desconocida o nunca. No entra en costos/días/m². Solo base para próxima fecha y estado.';
