-- recintos.tipo: catálogo cerrado + oficina.
-- En remoto no había check; se crea con los 5 valores.

alter table public.recintos
  drop constraint if exists recintos_tipo_check;

alter table public.recintos
  add constraint recintos_tipo_check
  check (
    tipo is null
    or tipo in (
      'local',
      'bodega',
      'estacionamiento',
      'area_comun',
      'oficina'
    )
  );

comment on column public.recintos.tipo is
  'local | bodega | estacionamiento | area_comun | oficina';
