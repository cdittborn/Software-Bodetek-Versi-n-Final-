/**
 * Genera supabase/seed-fachadas-v2.sql desde fachadas-v2.json.
 *
 *   node scripts/generar-seed-fachadas-v2.mjs
 *   node scripts/generar-seed-fachadas-v2.mjs --check
 *
 * Supuestos mientras el gerente no responda (DECISIONES parte 2):
 * - temporada julio–junio (MES_INICIO_TEMPORADA = 7; la usa la fase 2)
 * - alto_m y superficie_m2 en null (no se cargan los 7/5/3 m supuestos)
 * - bordes inferiores del Sitio 2 = exteriores (ya vienen así en el JSON)
 * - link de socios sin vencimiento (token_expira null; lo define la migración)
 * - espacios comunes como recintos area_comun (los inserta la migración)
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MES_INICIO_TEMPORADA = 7;
const FACHADA_EXISTENTE_ID = "95c58c33-5034-4403-977b-6bd04efb4310";
const FACHADA_EXISTENTE_SVG = "s1-local-1-f1";

/** unidad_id del plano → recinto (sitio, codigo). Acceso y Cierre Huasco no van. */
const UNIDAD_A_RECINTO = {
  "s1-bodega-1a": { sitio: "1", codigo: "1A" },
  "s1-bodega-1b": { sitio: "1", codigo: "1B" },
  "s1-bodega-2a": { sitio: "1", codigo: "2A" },
  "s1-bodega-2b": { sitio: "1", codigo: "2B" },
  "s1-bodega-3a": { sitio: "1", codigo: "3A" },
  "s1-bodega-3b1": { sitio: "1", codigo: "3B1" },
  "s1-bodega-3b2": { sitio: "1", codigo: "3B2" },
  "s1-bodega-4a": { sitio: "1", codigo: "4A" },
  "s1-bodega-4b": { sitio: "1", codigo: "4B" },
  "s1-bodega-5": { sitio: "1", codigo: "5" },
  "s1-local-1": { sitio: "1", codigo: "LOCAL 1" },
  "s1-local-2-3": { sitio: "1", codigo: "LOCAL 2 Y 3" },
  "s1-local-4": { sitio: "1", codigo: "LOCAL 4" },
  "s1-local-5": { sitio: "1", codigo: "LOCAL 5" },
  "s1-local-6": { sitio: "1", codigo: "LOCAL 6" },
  "s1-local-7": { sitio: "1", codigo: "LOCAL 7" },
  "s1-taller-maestros": { sitio: "1", codigo: "TALLER MAESTROS" },
  "s1-banos-comunes": { sitio: "1", codigo: "BANOS COMUNES" },
  "s1-comedor": { sitio: "1", codigo: "COMEDOR" },
  "s2-bodega-s1": { sitio: "2", codigo: "S1" },
  "s2-bodega-s2": { sitio: "2", codigo: "S2" },
  "s2-bodega-s3": { sitio: "2", codigo: "S3" },
  "s2-bodega-s4": { sitio: "2", codigo: "S4" },
  "s2-bodega-s5": { sitio: "2", codigo: "S5" },
  "s2-bodega-s6": { sitio: "2", codigo: "S6" },
  "s2-recinto-4": { sitio: "2", codigo: "4" },
  "s2-oficina-10": { sitio: "2", codigo: "10" },
  "s2-bodega-6": { sitio: "2", codigo: "6" },
  "s2-local-1-2": { sitio: "2", codigo: "LOCAL 1 Y 2" },
  "s2-local-3": { sitio: "2", codigo: "LOCAL 3" },
  "s2-local-4": { sitio: "2", codigo: "LOCAL 4" },
  "s2-local-5": { sitio: "2", codigo: "LOCAL 5" },
  "s2-bodega-maestros": { sitio: "2", codigo: "BODEGA MAESTROS" },
  "s2-oficina-admin": { sitio: "2", codigo: "OFICINA ADMINISTRACION" },
};

const SIN_RECINTO = new Set(["s1-acceso", "s2-cierre-huasco"]);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = path.join(root, "docs/diseno/fachadas/v2/plano/fachadas-v2.json");
const outPath = path.join(root, "supabase/seed-fachadas-v2.sql");

function sqlText(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlNum(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`largo_m_aprox inválido: ${value}`);
  }
  return n.toFixed(2);
}

function recintoDe(unidadId) {
  if (SIN_RECINTO.has(unidadId)) return null;
  const rec = UNIDAD_A_RECINTO[unidadId];
  if (!rec) throw new Error(`unidad_id sin mapeo: ${unidadId}`);
  if (rec.sitio === "2" && (rec.codigo === "7" || rec.codigo === "8")) {
    throw new Error(`mapeo prohibido a Bodega 7 u 8: ${unidadId}`);
  }
  return rec;
}

function filaDe(fachada, orden) {
  const ids = fachada.unidad_ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error(`${fachada.svg_id} no tiene unidad_ids`);
  }
  const recintos = [];
  for (const id of ids) {
    const rec = recintoDe(id);
    if (rec) recintos.push(rec);
  }
  if (fachada.tipo_espacio === "unidad" && recintos.length !== 1) {
    throw new Error(`${fachada.svg_id} unidad debe tener 1 recinto`);
  }
  if (fachada.tipo_espacio === "compartida" && recintos.length < 2) {
    throw new Error(`${fachada.svg_id} compartida debe tener ≥2 recintos`);
  }
  if (fachada.tipo_espacio === "perimetro" && recintos.length !== 0) {
    throw new Error(`${fachada.svg_id} perímetro no es recinto`);
  }
  if (fachada.svg_id === "s1-acceso-f1" && recintos.length !== 0) {
    throw new Error("Acceso no es recinto");
  }
  return {
    svgId: fachada.svg_id,
    nombre: fachada.nombre,
    ubicacion: fachada.ubicacion,
    tipoEspacio: fachada.tipo_espacio,
    unidadLabel: fachada.unidad_label,
    orden,
    largo: sqlNum(fachada.largo_m_aprox),
    recinto: recintos[0] ?? null,
    recintos,
  };
}

export function construirSeed(doc) {
  const fachadas = doc.fachadas;
  if (!Array.isArray(fachadas) || fachadas.length !== 69) {
    throw new Error(`se esperaban 69 fachadas, hay ${fachadas?.length}`);
  }
  const vistos = new Set();
  const ordenPorLabel = new Map();
  const filas = [];
  for (const fachada of fachadas) {
    if (vistos.has(fachada.svg_id)) throw new Error(`svg_id duplicado: ${fachada.svg_id}`);
    vistos.add(fachada.svg_id);
    if (fachada.ubicacion !== "interior" && fachada.ubicacion !== "exterior") {
      throw new Error(`ubicacion inválida en ${fachada.svg_id}`);
    }
    const n = (ordenPorLabel.get(fachada.unidad_label) ?? 0) + 1;
    ordenPorLabel.set(fachada.unidad_label, n);
    filas.push(filaDe(fachada, n));
  }

  const contar = (pred) => filas.filter(pred).length;
  const esperados = {
    exterior: 18,
    interior: 51,
    unidad: 55,
    compartida: 4,
    espacio_comun: 6,
    perimetro: 4,
  };
  for (const [key, n] of Object.entries(esperados)) {
    const real =
      key === "exterior" || key === "interior"
        ? contar((f) => f.ubicacion === key)
        : contar((f) => f.tipoEspacio === key);
    if (real !== n) throw new Error(`${key}: ${real}, se esperaban ${n}`);
  }

  const existente = filas.find((f) => f.svgId === FACHADA_EXISTENTE_SVG);
  if (!existente) throw new Error(`falta ${FACHADA_EXISTENTE_SVG}`);
  if (!existente.recinto || existente.recinto.codigo !== "LOCAL 1" || existente.recinto.sitio !== "1") {
    throw new Error("s1-local-1-f1 tiene que apuntar a (1, LOCAL 1)");
  }

  const local4 = filas.find((f) => f.svgId === "s1-local-4-f1");
  if (!local4?.recinto || local4.recinto.sitio !== "1" || local4.recinto.codigo !== "LOCAL 4") {
    throw new Error("s1-local-4-f1 tiene que apuntar a (1, LOCAL 4)");
  }

  const frente = filas.find((f) => f.svgId === "s2-frente-iquique-f1");
  if (!frente || frente.recintos.length !== 5) {
    throw new Error("s2-frente-iquique-f1 tiene que tener 5 recintos");
  }

  const pares = new Map();
  const links = [];
  for (const fila of filas) {
    for (const rec of fila.recintos) {
      const key = `${fila.svgId}\0${rec.sitio}\0${rec.codigo}`;
      if (pares.has(key)) continue;
      pares.set(key, true);
      links.push({ svgId: fila.svgId, sitio: rec.sitio, codigo: rec.codigo });
    }
  }

  const codigos = new Map();
  for (const fila of filas) {
    if (!fila.recinto) continue;
    codigos.set(`${fila.recinto.sitio}\0${fila.recinto.codigo}`, fila.recinto);
    for (const rec of fila.recintos) {
      codigos.set(`${rec.sitio}\0${rec.codigo}`, rec);
    }
  }

  const valuesFachadas = filas
    .map((f) => {
      const sitio = f.recinto ? sqlText(f.recinto.sitio) : "null::text";
      const codigo = f.recinto ? sqlText(f.recinto.codigo) : "null::text";
      return `  (${sqlText(f.svgId)}, ${sqlText(f.nombre)}, ${sqlText(f.ubicacion)}, ${sqlText(f.tipoEspacio)}, ${sqlText(f.unidadLabel)}, ${f.orden}, ${f.largo}, ${sitio}, ${codigo})`;
    })
    .join(",\n");

  const valuesCodigos = [...codigos.values()]
    .map((r) => `    (${sqlText(r.sitio)}, ${sqlText(r.codigo)})`)
    .join(",\n");

  const valuesLinks = links
    .map((l) => `    (${sqlText(l.svgId)}, ${sqlText(l.sitio)}, ${sqlText(l.codigo)})`)
    .join(",\n");

  const sql = `-- Generado por scripts/generar-seed-fachadas-v2.mjs. No editar a mano.
-- Fuente: docs/diseno/fachadas/v2/plano/fachadas-v2.json (69 fachadas).
-- Idempotente: upsert por svg_id. No borra archivos, intervenciones ni otras fachadas.
--
-- Supuestos (DECISIONES parte 2, mientras el gerente no responda):
--   MES_INICIO_TEMPORADA = ${MES_INICIO_TEMPORADA} (julio–junio; lo aplica la fase 2, no hay columna).
--   alto_m y superficie_m2 = null. No se cargan los supuestos de 7/5/3 m.
--   Bordes inferiores del Sitio 2 = exteriores (ubicacion del JSON).
--   El link de socios no vence (token_expira null en la migración).
--   Espacios comunes = recintos area_comun, insertados por la migración.
--   Acceso y Cierre Huasco no son recintos: quedan con recinto_id null.
--
-- La fila ${FACHADA_EXISTENTE_ID} se actualiza a ${FACHADA_EXISTENTE_SVG}
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
${valuesCodigos}
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
  svg_id = ${sqlText(FACHADA_EXISTENTE_SVG)},
  notas = case
    when f.notas is null or btrim(f.notas) = '' then f.nombre
    else f.notas
  end,
  nombre = ${sqlText(existente.nombre)},
  ubicacion = ${sqlText(existente.ubicacion)},
  tipo_espacio = ${sqlText(existente.tipoEspacio)},
  unidad_label = ${sqlText(existente.unidadLabel)},
  orden = ${existente.orden},
  largo_plano_m = ${existente.largo},
  ancho_m = ${existente.largo},
  alto_m = null,
  superficie_m2 = null,
  evaluada_en = null,
  recinto_id = (
    select r.id
    from public.recintos r
    where r.sitio = '1'
      and r.codigo = 'LOCAL 1'
  )
where f.id = ${sqlText(FACHADA_EXISTENTE_ID)}::uuid
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
${valuesFachadas}
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
    where id = ${sqlText(FACHADA_EXISTENTE_ID)}::uuid
      and svg_id is distinct from ${sqlText(FACHADA_EXISTENTE_SVG)}
  ) then
    raise exception 'la fachada ${FACHADA_EXISTENTE_ID} no quedó en ${FACHADA_EXISTENTE_SVG}';
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
${valuesLinks}
) as v(svg_id, sitio, codigo)
join public.fachadas f on f.svg_id = v.svg_id
join public.recintos r on r.sitio = v.sitio and r.codigo = v.codigo;

do $$
declare
  links int;
begin
  select count(*) into links from public.fachada_recintos;
  if links <> ${links.length} then
    raise exception 'fachada_recintos: % filas, se esperaban ${links.length}', links;
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
`;

  return { sql, links: links.length, filas: filas.length };
}

const esEntrada =
  process.argv[1] != null && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (esEntrada) {
  const check = process.argv.includes("--check");
  const doc = JSON.parse(readFileSync(jsonPath, "utf8"));
  const { sql, links, filas } = construirSeed(doc);

  if (check) {
    const actual = readFileSync(outPath, "utf8");
    if (actual !== sql) {
      console.error("supabase/seed-fachadas-v2.sql está desactualizado.");
      process.exit(1);
    }
    console.log(`seed ok: ${filas} fachadas, ${links} vínculos`);
  } else {
    writeFileSync(outPath, sql);
    console.log(`escribí ${path.relative(root, outPath)} (${filas} fachadas, ${links} vínculos)`);
  }
}
