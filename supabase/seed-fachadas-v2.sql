-- Generado por scripts/generar-seed-fachadas-v2.mjs. No editar a mano.
-- Fuente: docs/diseno/fachadas/v2/plano/fachadas-v2.json (69 fachadas).
-- Idempotente: upsert por svg_id. No borra archivos, intervenciones ni otras fachadas.
--
-- Supuestos (DECISIONES parte 2, mientras el gerente no responda):
--   MES_INICIO_TEMPORADA = 7 (julio–junio; lo aplica la fase 2, no hay columna).
--   alto_m y superficie_m2 = null. No se cargan los supuestos de 7/5/3 m.
--   Bordes inferiores del Sitio 2 = exteriores (ubicacion del JSON).
--   El link de socios no vence (token_expira null en la migración).
--   Espacios comunes = recintos area_comun, insertados por la migración.
--   Acceso y Cierre Huasco no son recintos: quedan con recinto_id null.
--
-- La fila 95c58c33-5034-4403-977b-6bd04efb4310 se actualiza a s1-local-1-f1
-- solo si svg_id sigue null. El nombre anterior pasa a notas si notas está vacío.
-- ancho_m y largo_plano_m = largo_m_aprox. Un re-seed no pisa alto, superficie,
-- ancho, notas ni evaluada_en ya escritos.

do $$
declare
  faltan int;
begin
  select count(*) into faltan
  from (
    values
    ('1', '1A'),
    ('1', '1B'),
    ('1', '4A'),
    ('1', '4B'),
    ('1', '2A'),
    ('1', '2B'),
    ('1', '3A'),
    ('1', '3B2'),
    ('1', '3B1'),
    ('1', '5'),
    ('1', 'LOCAL 1'),
    ('1', 'LOCAL 2 Y 3'),
    ('1', 'LOCAL 4'),
    ('1', 'LOCAL 5'),
    ('1', 'LOCAL 6'),
    ('1', 'LOCAL 7'),
    ('2', 'S5'),
    ('2', 'S4'),
    ('2', 'S3'),
    ('2', 'S2'),
    ('2', 'S1'),
    ('2', 'S6'),
    ('2', '4'),
    ('2', '10'),
    ('2', '6'),
    ('2', 'LOCAL 1 Y 2'),
    ('2', 'LOCAL 3'),
    ('2', 'LOCAL 4'),
    ('2', 'LOCAL 5'),
    ('1', 'COMEDOR'),
    ('1', 'TALLER MAESTROS'),
    ('1', 'BANOS COMUNES'),
    ('2', 'BODEGA MAESTROS'),
    ('2', 'OFICINA ADMINISTRACION')
  ) as v(sitio, codigo)
  where (
    select count(*)
    from public.recintos r
    where r.sitio = v.sitio
      and r.codigo = v.codigo
  ) <> 1;
  if faltan <> 0 then
    raise exception 'seed fachadas v2: % códigos no matchean exactamente 1 recinto', faltan;
  end if;
end $$;

update public.fachadas f
set
  svg_id = 's1-local-1-f1',
  notas = case
    when f.notas is null or btrim(f.notas) = '' then f.nombre
    else f.notas
  end,
  nombre = 'Local 1 · Fachada 1 (hacia calle interior Sitio 1)',
  ubicacion = 'interior',
  tipo_espacio = 'unidad',
  unidad_label = 'Local 1',
  orden = 1,
  largo_plano_m = 17.70,
  ancho_m = 17.70,
  alto_m = null,
  superficie_m2 = null,
  evaluada_en = null,
  recinto_id = (
    select r.id
    from public.recintos r
    where r.sitio = '1'
      and r.codigo = 'LOCAL 1'
  )
where f.id = '95c58c33-5034-4403-977b-6bd04efb4310'::uuid
  and f.svg_id is null;

insert into public.fachadas (
  svg_id,
  nombre,
  ubicacion,
  tipo_espacio,
  unidad_label,
  orden,
  largo_plano_m,
  ancho_m,
  alto_m,
  superficie_m2,
  evaluada_en,
  recinto_id
)
select
  v.svg_id,
  v.nombre,
  v.ubicacion,
  v.tipo_espacio,
  v.unidad_label,
  v.orden,
  v.largo,
  v.largo,
  null,
  null,
  null,
  r.id
from (
  values
  ('s1-bodega-1a-f1', 'Bodega 1A · Fachada 1 (hacia Calle Iquique)', 'exterior', 'unidad', 'Bodega 1A', 1, 27.40, '1', '1A'),
  ('s1-bodega-1a-f2', 'Bodega 1A · Fachada 2 (hacia Calle Víctor Jara)', 'exterior', 'unidad', 'Bodega 1A', 2, 27.00, '1', '1A'),
  ('s1-bodega-1b-f1', 'Bodega 1B · Fachada 1 (hacia Calle Iquique)', 'exterior', 'unidad', 'Bodega 1B', 1, 20.70, '1', '1B'),
  ('s1-bodega-1b-f2', 'Bodega 1B · Fachada 2 (hacia andenes)', 'interior', 'unidad', 'Bodega 1B', 2, 9.50, '1', '1B'),
  ('s1-bodega-4a-f1', 'Bodega 4A · Fachada 1 (hacia Calle Iquique)', 'exterior', 'unidad', 'Bodega 4A', 1, 30.70, '1', '4A'),
  ('s1-bodega-4b-f1', 'Bodega 4B · Fachada 1 (hacia Calle Iquique)', 'exterior', 'unidad', 'Bodega 4B', 1, 26.40, '1', '4B'),
  ('s1-bodega-4b-f2', 'Bodega 4B · Fachada 2 (hacia circulación Sitio 1)', 'interior', 'unidad', 'Bodega 4B', 2, 27.00, '1', '4B'),
  ('s1-bodega-4b-f3', 'Bodega 4B · Fachada 3 (hacia andenes)', 'interior', 'unidad', 'Bodega 4B', 3, 9.20, '1', '4B'),
  ('s1-bodega-2a-f1', 'Bodega 2A · Fachada 1 (hacia calle interior Sitio 1)', 'interior', 'unidad', 'Bodega 2A', 1, 17.10, '1', '2A'),
  ('s1-bodega-2a-f2', 'Bodega 2A · Fachada 2 (hacia Calle Víctor Jara)', 'exterior', 'unidad', 'Bodega 2A', 2, 28.50, '1', '2A'),
  ('s1-bodega-2b-f1', 'Bodega 2B · Fachada 1 (hacia andenes)', 'interior', 'unidad', 'Bodega 2B', 1, 28.50, '1', '2B'),
  ('s1-bodega-2b-f2', 'Bodega 2B · Fachada 2 (hacia calle interior Sitio 1)', 'interior', 'unidad', 'Bodega 2B', 2, 17.70, '1', '2B'),
  ('s1-bodega-3a-f1', 'Bodega 3A · Fachada 1 (hacia calle interior Sitio 1)', 'interior', 'unidad', 'Bodega 3A', 1, 17.10, '1', '3A'),
  ('s1-bodega-3a-f2', 'Bodega 3A · Fachada 2 (hacia andenes)', 'interior', 'unidad', 'Bodega 3A', 2, 28.50, '1', '3A'),
  ('s1-bodega-3b2-f1', 'Bodega 3B2 · Fachada 1 (hacia andenes)', 'interior', 'unidad', 'Bodega 3B2', 1, 14.20, '1', '3B2'),
  ('s1-bodega-3b1-f1', 'Bodega 3B1 · Fachada 1 (hacia andenes)', 'interior', 'unidad', 'Bodega 3B1', 1, 14.30, '1', '3B1'),
  ('s1-bodega-3b1-f2', 'Bodega 3B1 · Fachada 2 (hacia calle interior Sitio 1)', 'interior', 'unidad', 'Bodega 3B1', 2, 17.80, '1', '3B1'),
  ('s1-bodega-5-f1', 'Bodega 5 · Fachada 1 (hacia circulación Sitio 1)', 'interior', 'unidad', 'Bodega 5', 1, 28.50, '1', '5'),
  ('s1-bodega-5-f2', 'Bodega 5 · Fachada 2 (hacia calle interior Sitio 1)', 'interior', 'unidad', 'Bodega 5', 2, 16.90, '1', '5'),
  ('s1-bodega-5-f3', 'Bodega 5 · Fachada 3 (hacia andenes)', 'interior', 'unidad', 'Bodega 5', 3, 28.50, '1', '5'),
  ('s1-local-1-f1', 'Local 1 · Fachada 1 (hacia calle interior Sitio 1)', 'interior', 'unidad', 'Local 1', 1, 17.70, '1', 'LOCAL 1'),
  ('s1-local-1-f2', 'Local 1 · Fachada 2 (hacia corredor cubierto)', 'interior', 'unidad', 'Local 1', 2, 17.70, '1', 'LOCAL 1'),
  ('s1-local-1-f3', 'Local 1 · Fachada 3 (hacia Calle Víctor Jara)', 'exterior', 'unidad', 'Local 1', 3, 21.00, '1', 'LOCAL 1'),
  ('s1-local-2-3-f1', 'Local 2 y 3 · Fachada 1 (hacia calle interior Sitio 1)', 'interior', 'unidad', 'Local 2 y 3', 1, 26.60, '1', 'LOCAL 2 Y 3'),
  ('s1-local-2-3-f2', 'Local 2 y 3 · Fachada 2 (hacia corredor cubierto)', 'interior', 'unidad', 'Local 2 y 3', 2, 26.60, '1', 'LOCAL 2 Y 3'),
  ('s1-local-4-f1', 'Local 4 · Fachada 1 (hacia calle interior Sitio 1)', 'interior', 'unidad', 'Local 4', 1, 18.20, '1', 'LOCAL 4'),
  ('s1-local-4-f2', 'Local 4 · Fachada 2 (hacia corredor cubierto)', 'interior', 'unidad', 'Local 4', 2, 18.20, '1', 'LOCAL 4'),
  ('s1-local-5-f1', 'Local 5 · Fachada 1 (hacia calle interior Sitio 1)', 'interior', 'unidad', 'Local 5', 1, 8.80, '1', 'LOCAL 5'),
  ('s1-local-5-f2', 'Local 5 · Fachada 2 (hacia corredor cubierto)', 'interior', 'unidad', 'Local 5', 2, 8.80, '1', 'LOCAL 5'),
  ('s1-local-6-f1', 'Local 6 · Fachada 1 (hacia calle interior Sitio 1)', 'interior', 'unidad', 'Local 6', 1, 7.30, '1', 'LOCAL 6'),
  ('s1-locales-6-7-f1', 'Local 6 + Local 7 · Fachada 1 (hacia pasillo)', 'interior', 'compartida', 'Local 6 + Local 7', 1, 37.10, '1', 'LOCAL 6'),
  ('s1-local-6-f2', 'Local 6 · Fachada 2 (hacia corredor cubierto)', 'interior', 'unidad', 'Local 6', 2, 17.20, '1', 'LOCAL 6'),
  ('s1-local-7-f1', 'Local 7 · Fachada 1 (hacia calle interior Sitio 1)', 'interior', 'unidad', 'Local 7', 1, 18.40, '1', 'LOCAL 7'),
  ('s1-local-7-f2', 'Local 7 · Fachada 2 (hacia acceso principal)', 'interior', 'unidad', 'Local 7', 2, 21.00, '1', 'LOCAL 7'),
  ('s1-local-7-f3', 'Local 7 · Fachada 3 (hacia corredor cubierto)', 'interior', 'unidad', 'Local 7', 3, 18.40, '1', 'LOCAL 7'),
  ('s1-acceso-f1', 'Acceso principal · Fachada 1 (hacia Calle Iquique)', 'exterior', 'espacio_comun', 'Acceso principal', 1, 17.80, null::text, null::text),
  ('s2-frente-iquique-f1', 'Bodegas S-5 a S-1 · Fachada 1 (hacia Calle Iquique)', 'exterior', 'compartida', 'Bodegas S-5 a S-1', 1, 72.50, '2', 'S5'),
  ('s2-bodega-s5-f1', 'Bodega S-5 · Fachada 1 (hacia circulación Sitio 2)', 'interior', 'unidad', 'Bodega S-5', 1, 14.60, '2', 'S5'),
  ('s2-bodega-s5-f2', 'Bodega S-5 · Fachada 2 (hacia acceso principal)', 'interior', 'unidad', 'Bodega S-5', 2, 12.30, '2', 'S5'),
  ('s2-bodega-s4-f1', 'Bodega S-4 · Fachada 1 (hacia circulación Sitio 2)', 'interior', 'unidad', 'Bodega S-4', 1, 15.80, '2', 'S4'),
  ('s2-bodega-s3-f1', 'Bodega S-3 · Fachada 1 (hacia circulación Sitio 2)', 'interior', 'unidad', 'Bodega S-3', 1, 9.80, '2', 'S3'),
  ('s2-bodega-s3-f2', 'Bodega S-3 · Fachada 2 (hacia circulación Sitio 2)', 'interior', 'unidad', 'Bodega S-3', 2, 7.30, '2', 'S3'),
  ('s2-bodega-s3-f3', 'Bodega S-3 · Fachada 3 (hacia circulación Sitio 2)', 'interior', 'unidad', 'Bodega S-3', 3, 9.50, '2', 'S3'),
  ('s2-bodega-s2-f1', 'Bodega S-2 · Fachada 1 (hacia circulación Sitio 2)', 'interior', 'unidad', 'Bodega S-2', 1, 9.20, '2', 'S2'),
  ('s2-bodega-s1-f1', 'Bodega S-1 · Fachada 1 (hacia circulación Sitio 2)', 'interior', 'unidad', 'Bodega S-1', 1, 38.00, '2', 'S1'),
  ('s2-bodega-s6-f1', 'Bodega S-6 · Fachada 1 (hacia circulación Sitio 2)', 'interior', 'unidad', 'Bodega S-6', 1, 11.20, '2', 'S6'),
  ('s2-bodega-s6-f2', 'Bodega S-6 · Fachada 2 (hacia circulación Sitio 2)', 'interior', 'unidad', 'Bodega S-6', 2, 10.90, '2', 'S6'),
  ('s2-recinto-4-f1', 'Recinto 4 · Fachada 1 (hacia circulación Sitio 2)', 'interior', 'unidad', 'Recinto 4', 1, 29.80, '2', '4'),
  ('s2-oficina-10-f1', 'Of. 10 · Fachada 1 (hacia circulación Sitio 2)', 'interior', 'unidad', 'Of. 10', 1, 4.70, '2', '10'),
  ('s2-oficina-10-f2', 'Of. 10 · Fachada 2 (hacia circulación Sitio 2)', 'interior', 'unidad', 'Of. 10', 2, 10.20, '2', '10'),
  ('s2-bodega-6-f1', 'Bodega 6 · Fachada 1 (hacia circulación Sitio 2)', 'interior', 'unidad', 'Bodega 6', 1, 4.70, '2', '6'),
  ('s2-bodega-6-f2', 'Bodega 6 · Fachada 2 (hacia circulación Sitio 2)', 'interior', 'unidad', 'Bodega 6', 2, 23.90, '2', '6'),
  ('s2-local-1-2-f1', 'Local 1 y 2 · Fachada 1 (hacia circulación Sitio 2)', 'interior', 'unidad', 'Local 1 y 2', 1, 4.20, '2', 'LOCAL 1 Y 2'),
  ('s2-locales-1-2-3-f1', 'Local 1 y 2 + Local 3 · Fachada 1 (hacia circulación Sitio 2)', 'interior', 'compartida', 'Local 1 y 2 + Local 3', 1, 21.70, '2', 'LOCAL 1 Y 2'),
  ('s2-local-1-2-f2', 'Local 1 y 2 · Fachada 2 (hacia Av. Edmundo Pérez Zujovic)', 'exterior', 'unidad', 'Local 1 y 2', 2, 27.40, '2', 'LOCAL 1 Y 2'),
  ('s2-local-1-2-f3', 'Local 1 y 2 · Fachada 3 (hacia circulación Sitio 2)', 'interior', 'unidad', 'Local 1 y 2', 3, 23.20, '2', 'LOCAL 1 Y 2'),
  ('s2-local-3-f1', 'Local 3 · Fachada 1 (hacia Av. Edmundo Pérez Zujovic)', 'exterior', 'unidad', 'Local 3', 1, 13.00, '2', 'LOCAL 3'),
  ('s2-locales-4-5-f1', 'Local 4 + Local 5 · Fachada 1 (hacia Calle Huasco)', 'exterior', 'compartida', 'Local 4 + Local 5', 1, 26.60, '2', 'LOCAL 4'),
  ('s2-local-4-f1', 'Local 4 · Fachada 1 (hacia Av. Edmundo Pérez Zujovic)', 'exterior', 'unidad', 'Local 4', 3, 12.60, '2', 'LOCAL 4'),
  ('s2-local-5-f1', 'Local 5 · Fachada 1 (hacia Av. Edmundo Pérez Zujovic)', 'exterior', 'unidad', 'Local 5', 3, 13.40, '2', 'LOCAL 5'),
  ('s2-cierre-huasco-f1', 'Cierre Calle Huasco · Fachada 1 (hacia Calle Huasco)', 'exterior', 'perimetro', 'Cierre Calle Huasco', 1, 31.20, null::text, null::text),
  ('s2-cierre-huasco-f2', 'Cierre Calle Huasco · Fachada 2 (hacia Calle Huasco)', 'exterior', 'perimetro', 'Cierre Calle Huasco', 2, 12.70, null::text, null::text),
  ('s2-cierre-huasco-f3', 'Cierre Calle Huasco · Fachada 3 (hacia Calle Huasco)', 'exterior', 'perimetro', 'Cierre Calle Huasco', 3, 13.00, null::text, null::text),
  ('s2-cierre-huasco-f4', 'Cierre Calle Huasco · Fachada 4 (hacia Calle Huasco)', 'exterior', 'perimetro', 'Cierre Calle Huasco', 4, 19.20, null::text, null::text),
  ('s1-comedor-f1', 'Comedor · Fachada 1 (hacia calle interior Sitio 1)', 'interior', 'espacio_comun', 'Comedor', 1, 17.10, '1', 'COMEDOR'),
  ('s1-taller-maestros-f1', 'Taller de maestros · Fachada 1 (hacia acceso principal)', 'interior', 'espacio_comun', 'Taller de maestros', 1, 22.00, '1', 'TALLER MAESTROS'),
  ('s1-banos-comunes-f1', 'Baños comunes · Fachada 1 (hacia acceso principal)', 'interior', 'espacio_comun', 'Baños comunes', 1, 26.80, '1', 'BANOS COMUNES'),
  ('s2-bodega-maestros-f1', 'Bodega de maestros · Fachada 1 (hacia circulación Sitio 2)', 'interior', 'espacio_comun', 'Bodega de maestros', 1, 17.60, '2', 'BODEGA MAESTROS'),
  ('s2-oficina-admin-f1', 'Oficina administración · Fachada 1 (hacia circulación Sitio 2)', 'interior', 'espacio_comun', 'Oficina administración', 1, 22.20, '2', 'OFICINA ADMINISTRACION')
) as v(
  svg_id,
  nombre,
  ubicacion,
  tipo_espacio,
  unidad_label,
  orden,
  largo,
  sitio,
  codigo
)
left join public.recintos r
  on v.sitio is not null
 and r.sitio = v.sitio
 and r.codigo = v.codigo
on conflict (svg_id) do update
set
  nombre = excluded.nombre,
  ubicacion = excluded.ubicacion,
  tipo_espacio = excluded.tipo_espacio,
  unidad_label = excluded.unidad_label,
  orden = excluded.orden,
  largo_plano_m = excluded.largo_plano_m,
  recinto_id = excluded.recinto_id;

do $$
begin
  if exists (
    select 1
    from public.fachadas
    where id = '95c58c33-5034-4403-977b-6bd04efb4310'::uuid
      and svg_id is distinct from 's1-local-1-f1'
  ) then
    raise exception 'la fachada 95c58c33-5034-4403-977b-6bd04efb4310 no quedó en s1-local-1-f1';
  end if;

  if (select count(*) from public.fachadas) <> 69
     or (select count(*) from public.fachadas where svg_id is not null) <> 69 then
    raise exception 'seed fachadas v2: tienen que quedar 69 fachadas, todas con svg_id (no 70)';
  end if;
end $$;

delete from public.fachada_recintos fr
using public.fachadas f
where fr.fachada_id = f.id
  and f.svg_id is not null;

insert into public.fachada_recintos (fachada_id, recinto_id)
select f.id, r.id
from (
  values
    ('s1-bodega-1a-f1', '1', '1A'),
    ('s1-bodega-1a-f2', '1', '1A'),
    ('s1-bodega-1b-f1', '1', '1B'),
    ('s1-bodega-1b-f2', '1', '1B'),
    ('s1-bodega-4a-f1', '1', '4A'),
    ('s1-bodega-4b-f1', '1', '4B'),
    ('s1-bodega-4b-f2', '1', '4B'),
    ('s1-bodega-4b-f3', '1', '4B'),
    ('s1-bodega-2a-f1', '1', '2A'),
    ('s1-bodega-2a-f2', '1', '2A'),
    ('s1-bodega-2b-f1', '1', '2B'),
    ('s1-bodega-2b-f2', '1', '2B'),
    ('s1-bodega-3a-f1', '1', '3A'),
    ('s1-bodega-3a-f2', '1', '3A'),
    ('s1-bodega-3b2-f1', '1', '3B2'),
    ('s1-bodega-3b1-f1', '1', '3B1'),
    ('s1-bodega-3b1-f2', '1', '3B1'),
    ('s1-bodega-5-f1', '1', '5'),
    ('s1-bodega-5-f2', '1', '5'),
    ('s1-bodega-5-f3', '1', '5'),
    ('s1-local-1-f1', '1', 'LOCAL 1'),
    ('s1-local-1-f2', '1', 'LOCAL 1'),
    ('s1-local-1-f3', '1', 'LOCAL 1'),
    ('s1-local-2-3-f1', '1', 'LOCAL 2 Y 3'),
    ('s1-local-2-3-f2', '1', 'LOCAL 2 Y 3'),
    ('s1-local-4-f1', '1', 'LOCAL 4'),
    ('s1-local-4-f2', '1', 'LOCAL 4'),
    ('s1-local-5-f1', '1', 'LOCAL 5'),
    ('s1-local-5-f2', '1', 'LOCAL 5'),
    ('s1-local-6-f1', '1', 'LOCAL 6'),
    ('s1-locales-6-7-f1', '1', 'LOCAL 6'),
    ('s1-locales-6-7-f1', '1', 'LOCAL 7'),
    ('s1-local-6-f2', '1', 'LOCAL 6'),
    ('s1-local-7-f1', '1', 'LOCAL 7'),
    ('s1-local-7-f2', '1', 'LOCAL 7'),
    ('s1-local-7-f3', '1', 'LOCAL 7'),
    ('s2-frente-iquique-f1', '2', 'S5'),
    ('s2-frente-iquique-f1', '2', 'S4'),
    ('s2-frente-iquique-f1', '2', 'S3'),
    ('s2-frente-iquique-f1', '2', 'S2'),
    ('s2-frente-iquique-f1', '2', 'S1'),
    ('s2-bodega-s5-f1', '2', 'S5'),
    ('s2-bodega-s5-f2', '2', 'S5'),
    ('s2-bodega-s4-f1', '2', 'S4'),
    ('s2-bodega-s3-f1', '2', 'S3'),
    ('s2-bodega-s3-f2', '2', 'S3'),
    ('s2-bodega-s3-f3', '2', 'S3'),
    ('s2-bodega-s2-f1', '2', 'S2'),
    ('s2-bodega-s1-f1', '2', 'S1'),
    ('s2-bodega-s6-f1', '2', 'S6'),
    ('s2-bodega-s6-f2', '2', 'S6'),
    ('s2-recinto-4-f1', '2', '4'),
    ('s2-oficina-10-f1', '2', '10'),
    ('s2-oficina-10-f2', '2', '10'),
    ('s2-bodega-6-f1', '2', '6'),
    ('s2-bodega-6-f2', '2', '6'),
    ('s2-local-1-2-f1', '2', 'LOCAL 1 Y 2'),
    ('s2-locales-1-2-3-f1', '2', 'LOCAL 1 Y 2'),
    ('s2-locales-1-2-3-f1', '2', 'LOCAL 3'),
    ('s2-local-1-2-f2', '2', 'LOCAL 1 Y 2'),
    ('s2-local-1-2-f3', '2', 'LOCAL 1 Y 2'),
    ('s2-local-3-f1', '2', 'LOCAL 3'),
    ('s2-locales-4-5-f1', '2', 'LOCAL 4'),
    ('s2-locales-4-5-f1', '2', 'LOCAL 5'),
    ('s2-local-4-f1', '2', 'LOCAL 4'),
    ('s2-local-5-f1', '2', 'LOCAL 5'),
    ('s1-comedor-f1', '1', 'COMEDOR'),
    ('s1-taller-maestros-f1', '1', 'TALLER MAESTROS'),
    ('s1-banos-comunes-f1', '1', 'BANOS COMUNES'),
    ('s2-bodega-maestros-f1', '2', 'BODEGA MAESTROS'),
    ('s2-oficina-admin-f1', '2', 'OFICINA ADMINISTRACION')
) as v(svg_id, sitio, codigo)
join public.fachadas f on f.svg_id = v.svg_id
join public.recintos r on r.sitio = v.sitio and r.codigo = v.codigo;

do $$
declare
  links int;
begin
  select count(*) into links from public.fachada_recintos;
  if links <> 71 then
    raise exception 'fachada_recintos: % filas, se esperaban 71', links;
  end if;

  if exists (
    select 1
    from public.fachada_recintos fr
    join public.recintos r on r.id = fr.recinto_id
    where r.sitio = '2'
      and r.codigo in ('7', '8')
  ) or exists (
    select 1
    from public.fachadas f
    join public.recintos r on r.id = f.recinto_id
    where r.sitio = '2'
      and r.codigo in ('7', '8')
  ) then
    raise exception 'una fachada quedó vinculada a Bodega 7 u 8';
  end if;
end $$;
