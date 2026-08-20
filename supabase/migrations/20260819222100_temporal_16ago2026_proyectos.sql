-- Temporal 16 ago 2026: schema, recintos, fecha del evento y 26 Filtración-Proyecto.
-- No toca Patentes, Techos ni Auth.

-- ========== PASO 1.1 ejecutado_por ==========
alter table public.trabajos
  add column if not exists ejecutado_por text;

comment on column public.trabajos.ejecutado_por is
  'Quién ejecutó o está ejecutando la reparación (texto libre).';

-- ========== PASO 1.2 corregir S1 sitio 2 ==========
update public.recintos
set arrendatario_actual = 'MC ENERGY',
    updated_at = now()
where sitio = '2'
  and codigo = 'S1';

-- ========== PASO 1.3 áreas comunes ==========
insert into public.recintos (codigo, nombre, tipo, sitio, galpon)
values
  ('ADMINISTRACION', 'ADMINISTRACION', 'area_comun', '', ''),
  ('BAÑO ADMINISTRACION', 'BAÑO ADMINISTRACION', 'area_comun', '', ''),
  ('GARITA P1', 'GARITA P1', 'area_comun', '', '')
on conflict (sitio, galpon, codigo) do nothing;

-- ========== PASO 2 fecha del evento existente ==========
update public.eventos
set fecha = date '2026-08-16'
where id = '703356ea-67df-4490-9f92-bb88886973e4'
  and nombre = 'Temporal 16 ago 2026';

-- ========== PASO 3 datos del informe ==========
create temporary table import_temporal_16ago (
  sitio text not null,
  codigo text not null,
  arrendatario text,
  gravedad text not null,
  estado text not null,
  descripcion text,
  plan_accion text,
  ejecutado_por text
);

insert into import_temporal_16ago (
  sitio, codigo, arrendatario, gravedad, estado, descripcion, plan_accion, ejecutado_por
)
values
  ('1', '1B', 'SERV. GLOBALES', 'alta', 'en_proceso', 'Rotura en techumbre + colapso de canaleta pared poniente; cielos de laboratorio, baños y comedor colapsados. El colapso del cielo del laboratorio afectó los circuitos eléctricos, provocando corte eléctrico.', 'Reparación parche para contener lluvia; retiro de canaleta dañada realizado. Se ubicó proveedor de canaleta nueva, instalación programada (incluye bajada de agua para no afectar a Tremac). Revisión eléctrica pendiente hasta que seque el tablero.', 'Proveedor externo (techumbre/canaleta) + eléctrico externo de apoyo.'),
  ('1', 'LOCAL 6', 'PINTURAS TRICOLOR', 'alta', 'en_proceso', 'Roturas en techumbre (reparación ya finalizada). Posteriormente se detectó daño en cielo americano y se dañó el rack de comunicaciones, quedando sin sistema.', 'Reparación de techumbre finalizada. Pendiente evaluación y reparación del rack de comunicaciones.', 'Proveedor externo.'),
  ('1', 'LOCAL 2 Y 3', 'FRIGORIFICO TEMUCO', 'alta', 'en_proceso', 'Roturas en techumbre; tiene reparaciones antiguas hechas con planchas lisas, distintas al formato de zinc PV4 actual.', 'Reparación de techumbre en curso; se vio interrumpida por lluvia, continúa.', 'Proveedor externo.'),
  ('1', '2A', 'TODO IZAJE', 'alta', 'pendiente', 'Roturas en techumbre; sin canaleta, agua se acumula en el ingreso afectando materiales. Además, varias roturas en fachada norte sin canaleta, agua cae directo a la entrada, empozamiento afecta productos almacenados.', 'Pendiente reparación de techumbre y evaluación de instalación de canaleta; a la espera de respuesta del hojalatero para tiempo de fabricación de planchas de zinc.', 'Por asignar.'),
  ('2', '7', 'FERRETERIA INDUSTRIAL', 'alta', 'pendiente', 'Un par de roturas menores; caída de agua junto al ingreso → inundación; muchas filtraciones en oficinas afectando cielo americano.', 'Retiro de agua con bombas realizado; reparación de techumbre pendiente a la espera de respuesta del hojalatero.', 'Proveedor externo (bombeo); reparación techumbre pendiente asignación.'),
  ('2', 'LOCAL 3', 'MAXAM', 'alta', 'pendiente', 'Canaletas en muy mal estado; no intervenibles por sobre cubierta (techumbre de pizarreño, riesgo con humedad).', 'Definir método de intervención segura para pizarreño.', 'Por asignar.'),
  ('2', 'LOCAL 4', 'CASA ROSSIER', 'baja', 'pendiente', 'Canaletas en muy mal estado; no intervenibles por sobre cubierta (techumbre de pizarreño).', 'Definir método de intervención segura para pizarreño.', 'Por asignar.'),
  ('2', 'LOCAL 5', 'URIOSTE', 'alta', 'pendiente', 'Canaletas en muy mal estado; no intervenibles por sobre cubierta (techumbre de pizarreño).', 'Definir método de intervención segura para pizarreño.', 'Por asignar.'),
  ('1', 'LOCAL 1', 'AGUAS RIOS CRISTAL', 'baja', 'pendiente', 'Techumbre con roturas y daño en cielos americanos.', 'Pendiente reparación de techumbre (a la espera de respuesta del hojalatero).', 'Por asignar.'),
  ('1', 'LOCAL 4', 'WURTH LTDA.', 'baja', 'en_proceso', 'Techumbre con roturas y daño en cielos americanos.', 'Reparación de techumbre en proceso.', 'Por asignar.'),
  ('1', 'LOCAL 5', 'CHESTERTON CHILE', 'alta', 'pendiente', 'Techumbre con roturas y daño en cielos americanos; problemas eléctricos (reparación momentánea ya realizada).', 'Pendiente reparación de techumbre (a la espera del hojalatero); pendiente revisión eléctrica completa cuando sequen los tableros.', 'Eléctrico externo de apoyo.'),
  ('1', 'LOCAL 7', 'IDIEM', 'baja', 'pendiente', 'Techumbre con roturas y daño en cielos americanos.', 'Pendiente reparación de techumbre (a la espera de respuesta del hojalatero).', 'Por asignar.'),
  ('1', '5', 'ARQUETIPO LTDA.', 'baja', 'pendiente', 'Techumbre deteriorada por sectores. Falla eléctrica por tablero mojado + caída de una fase del medidor trifásico.', 'Reparación eléctrica momentánea realizada; gestión con CGE para reposición de fase (2 días de espera estándar, se solicitó anticipar sin compromiso formal).', 'Eléctrico externo de apoyo + CGE (pendiente).'),
  ('2', '6', 'SGS', 'baja', 'en_proceso', 'Techumbre con roturas; caída de agua junto al ingreso, bodega en bajo cota → inundación. Tablero eléctrico de administración mojado.', 'Retiro de agua acopiada con bombas (empresa externa); reparación eléctrica momentánea.', 'Proveedor externo (bombeo) + eléctrico externo de apoyo.'),
  ('2', 'LOCAL 1 Y 2', 'TEKNICA', 'media', 'pendiente', 'Filtraciones en todos los ductos de ventilación; dañó muebles nuevos y pisos.', 'Pendiente reparación de sellos de ductos.', 'Por asignar.'),
  ('1', '4B', 'BODEGA 4B FLUITEK', 'media', 'pendiente', 'Juntas de planchas sin sellar; empozamiento interior y en pasillo compartido (se instalaron tablones artesanales).', 'Pendiente sellado de juntas; sin daño relevante en productos.', 'Por asignar.'),
  ('1', '4A', 'FLUITEK MARCO SPA', 'media', 'pendiente', 'Rotura en techumbre, cielo de oficinas afectado (requiere cambio).', 'Pendiente cambio de cielo; sin daño relevante en productos.', 'Por asignar.'),
  ('2', 'S3', 'SINSEF', 'baja', 'pendiente', 'Roturas en techumbre; daño en cielos americanos de oficinas y baños.', 'Pendiente reparación de techumbre.', 'Por asignar.'),
  ('2', 'S2', 'MICROTEC', 'baja', 'pendiente', 'Roturas en techumbre; daño en cielos americanos de oficinas y baños.', 'Pendiente reparación de techumbre.', 'Por asignar.'),
  ('2', 'S1', 'MC ENERGY', 'baja', 'pendiente', 'Roturas en techumbre; daño en cielos americanos de oficinas y baños.', 'Pendiente reparación de techumbre.', 'Por asignar.'),
  ('1', '2B', 'COMERCIAL K', 'baja', 'pendiente', 'Roturas en techumbre; sin daño relevante en productos. Evacuó agua gracias a rampa, menos afectada.', 'Pendiente reparación de techumbre.', 'Por asignar.'),
  ('1', '3B1', 'RODASTOCK', 'baja', 'pendiente', 'Roturas en techumbre; sin daño relevante en productos. Filtraciones menores reportadas también en conjunto con NMK y Tremac.', 'Pendiente reparación de techumbre.', 'Por asignar.'),
  ('1', '3A', 'TREMAC', 'baja', 'en_proceso', 'Afectada indirectamente por caída de agua desde bodega GMS.', 'Se soluciona en conjunto con la reparación de canaleta de GMS (bajada de agua instalada para no afectar a Tremac).', 'Proveedor externo (vía reparación GMS).'),
  ('', 'ADMINISTRACION', null, 'baja', 'pendiente', 'Filtraciones puntuales.', 'Pendiente evaluación y reparación.', 'Por asignar.'),
  ('', 'BAÑO ADMINISTRACION', null, 'baja', 'pendiente', 'Filtraciones puntuales.', 'Pendiente evaluación y reparación.', 'Por asignar.'),
  ('', 'GARITA P1', null, 'baja', 'pendiente', 'Filtraciones puntuales.', 'Pendiente evaluación y reparación.', 'Por asignar.');

-- Validación: cada fila debe resolver exactamente 1 recinto.
do $$
declare
  rec record;
  n int := 0;
begin
  for rec in
    select t.sitio, t.codigo, count(r.id) as matches
    from import_temporal_16ago as t
    left join public.recintos as r
      on r.codigo = t.codigo
     and (
       (t.sitio <> '' and r.sitio = t.sitio)
       or (t.sitio = '')
     )
    group by t.sitio, t.codigo
    having count(r.id) <> 1
  loop
    raise notice 'SIN MATCH UNICO: sitio=% codigo=% matches=%', rec.sitio, rec.codigo, rec.matches;
    n := n + 1;
  end loop;

  if n > 0 then
    raise exception
      'Import Temporal 16 ago 2026: % fila(s) sin recinto unico. No se insertaron trabajos.',
      n;
  end if;
end;
$$;

insert into public.trabajos (
  categoria_id,
  subtipo_id,
  evento_id,
  recinto_id,
  titulo,
  descripcion,
  plan_accion,
  gravedad,
  estado,
  ejecutado_por
)
select
  c.id,
  s.id,
  e.id,
  r.id,
  'Filtración — ' || coalesce(nullif(btrim(t.arrendatario), ''), t.codigo),
  t.descripcion,
  t.plan_accion,
  t.gravedad,
  t.estado,
  t.ejecutado_por
from import_temporal_16ago as t
join public.trabajo_categorias as c
  on c.nombre = 'Techumbres y canales'
join public.trabajo_subtipos as s
  on s.categoria_id = c.id
 and s.nombre = 'Lluvias y temporales'
join public.eventos as e
  on e.id = '703356ea-67df-4490-9f92-bb88886973e4'
 and e.subtipo_id = s.id
join public.recintos as r
  on r.codigo = t.codigo
 and (
   (t.sitio <> '' and r.sitio = t.sitio)
   or (t.sitio = '')
 )
on conflict (evento_id, recinto_id) where evento_id is not null
do update set
  titulo = excluded.titulo,
  descripcion = excluded.descripcion,
  plan_accion = excluded.plan_accion,
  gravedad = excluded.gravedad,
  estado = excluded.estado,
  ejecutado_por = excluded.ejecutado_por,
  updated_at = now();
