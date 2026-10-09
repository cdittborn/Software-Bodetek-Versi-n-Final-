/**
 * Genera src/components/fachadas/plano/geometria.ts desde el SVG v2.
 * No pegar la geometría a mano.
 *
 *   node scripts/generar-geometria-plano.mjs
 *   node scripts/generar-geometria-plano.mjs --check
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = path.join(root, "docs/diseno/fachadas/v2/plano/plano-bodetek-v2.svg");
const outPath = path.join(root, "src/components/fachadas/plano/geometria.ts");

const FILL = {
  calle: "#E4E6EA",
  verde: "#E6EFE2",
  predio: "#F3F4F6",
  patio: "#F8F9FA",
  comun: "#E9EBEE",
  "comun-gris": "#DCDFE4",
  forma: "#FFFFFF",
};

const STROKE = {
  predio: { stroke: "#C9CDD3", strokeWidth: 1.5 },
  patio: { stroke: "#D1D5DB", strokeWidth: 1, dash: "4 4" },
  comun: { stroke: "#C9CDD3", strokeWidth: 1 },
  "comun-gris": { stroke: "#A3A9B3", strokeWidth: 1.4 },
  forma: { stroke: "#6B7280", strokeWidth: 1.4 },
};

function num(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`número inválido: ${value}`);
  return Math.round(n * 100) / 100;
}

function pointsOf(raw) {
  const nums = raw
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(num);
  if (nums.length < 2 || nums.length % 2 !== 0) {
    throw new Error(`points inválidos: ${raw}`);
  }
  const puntos = [];
  for (let i = 0; i < nums.length; i += 2) puntos.push([nums[i], nums[i + 1]]);
  return puntos;
}

function circlePoints(cx, cy, r, n = 32) {
  const x0 = num(cx);
  const y0 = num(cy);
  const radio = num(r);
  const puntos = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    puntos.push([num(x0 + radio * Math.cos(a)), num(y0 + radio * Math.sin(a))]);
  }
  return puntos;
}

function rectPoints(x, y, w, h) {
  const x0 = num(x);
  const y0 = num(y);
  const w0 = num(w);
  const h0 = num(h);
  return [
    [x0, y0],
    [num(x0 + w0), y0],
    [num(x0 + w0), num(y0 + h0)],
    [x0, num(y0 + h0)],
  ];
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return match ? match[1] : null;
}

function classOf(tag) {
  return attr(tag, "class");
}

function sliceGroup(svg, id) {
  const open = svg.indexOf(`id="${id}"`);
  if (open < 0) throw new Error(`falta g#${id}`);
  const start = svg.lastIndexOf("<g", open);
  let depth = 0;
  const re = /<\/?g\b[^>]*>/g;
  re.lastIndex = start;
  let match;
  while ((match = re.exec(svg))) {
    if (match[0].startsWith("</")) {
      depth -= 1;
      if (depth === 0) return svg.slice(start, match.index + match[0].length);
    } else {
      depth += 1;
    }
  }
  throw new Error(`g#${id} sin cierre`);
}

function textOf(chunk) {
  return chunk.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function rotuloDe(tag, inner) {
  const texto = textOf(inner);
  if (!texto) return null;
  const transform = attr(tag, "transform");
  let x = attr(tag, "x");
  let y = attr(tag, "y");
  let rotacion = null;
  if (transform) {
    const translate = transform.match(/translate\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/);
    const rotate = transform.match(/rotate\(\s*(-?\d+(?:\.\d+)?)\s*\)/);
    if (translate) {
      x = translate[1];
      y = translate[2];
    }
    if (rotate) rotacion = num(rotate[1]);
  }
  const style = attr(tag, "style") ?? "";
  const sizeStyle = style.match(/font-size:\s*(\d+(?:\.\d+)?)px/);
  const clase = classOf(tag) ?? "";
  const size = sizeStyle
    ? num(sizeStyle[1])
    : clase.includes("sitio-txt")
      ? 15
      : clase.includes("calle-txt")
        ? 13
        : clase.includes("comun-gris-txt")
          ? 7.5
          : clase.includes("num")
            ? 22
            : clase.includes("cap")
              ? 9.5
              : 11;
  const fill = clase.includes("num")
    ? "#111827"
    : clase.includes("comun-gris-txt")
      ? "#4B5563"
      : clase.includes("sitio-txt")
        ? "#B8BDC4"
        : clase.includes("calle-txt")
          ? "#8A9099"
          : "#9AA0A8";
  const ancla = attr(tag, "text-anchor");
  const textAnchor =
    ancla === "start" || ancla === "middle" || ancla === "end"
      ? ancla
      : clase.includes("comun-gris-txt") || clase.includes("num") || clase.includes("cap")
        ? "middle"
        : "start";
  return {
    texto,
    x: num(x),
    y: num(y),
    size,
    fill,
    textAnchor,
    rotacion,
  };
}

function formaDe(tag, puntos) {
  const id = attr(tag, "id");
  const clase = classOf(tag) ?? "";
  const fill = FILL[clase] ?? "none";
  const trazo = STROKE[clase] ?? {};
  const dash = attr(tag, "stroke-dasharray") ?? trazo.dash ?? null;
  const stroke = attr(tag, "stroke") ?? trazo.stroke ?? null;
  const strokeWidth = attr(tag, "stroke-width");
  return {
    id,
    puntos,
    fill,
    stroke,
    strokeWidth: strokeWidth ? num(strokeWidth) : trazo.strokeWidth ?? null,
    dash,
    rotulos: [],
  };
}

function formasEn(chunk) {
  const formas = [];
  const re =
    /<(rect|polygon|circle|line)\b([^>]*?)\/>|<text\b([^>]*)>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = re.exec(chunk))) {
    if (match[1]) {
      const tag = match[0];
      const kind = match[1];
      let puntos;
      if (kind === "rect") {
        puntos = rectPoints(attr(tag, "x"), attr(tag, "y"), attr(tag, "width"), attr(tag, "height"));
      } else if (kind === "polygon") {
        puntos = pointsOf(attr(tag, "points"));
      } else if (kind === "circle") {
        puntos = circlePoints(attr(tag, "cx"), attr(tag, "cy"), attr(tag, "r"));
      } else {
        puntos = [
          [num(attr(tag, "x1")), num(attr(tag, "y1"))],
          [num(attr(tag, "x2")), num(attr(tag, "y2"))],
        ];
      }
      formas.push(formaDe(tag, puntos));
    } else {
      const rotulo = rotuloDe(`<text ${match[3]}>`, match[4]);
      if (!rotulo) continue;
      const ultima = formas[formas.length - 1];
      if (ultima) ultima.rotulos.push(rotulo);
      else formas.push({ id: null, puntos: [], fill: "none", stroke: null, strokeWidth: null, dash: null, rotulos: [rotulo] });
    }
  }
  return formas;
}

function unidadesEn(chunk) {
  const unidades = [];
  const re = /<g\b([^>]*\bclass="unidad"[^>]*)>([\s\S]*?)<\/g>/g;
  let match;
  while ((match = re.exec(chunk))) {
    const tag = `<g ${match[1]}>`;
    const inner = match[2];
    const polygon = inner.match(/<polygon\b([^>]*)\/?>/);
    if (!polygon) throw new Error(`unidad sin polígono: ${attr(tag, "id")}`);
    const forma = formaDe(`<polygon ${polygon[1]} class="forma"/>`, pointsOf(attr(polygon[0], "points")));
    forma.id = attr(tag, "id");
    const textos = inner.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g);
    for (const texto of textos) {
      const rotulo = rotuloDe(`<text ${texto[1]}>`, texto[2]);
      if (rotulo) forma.rotulos.push(rotulo);
    }
    unidades.push({
      id: attr(tag, "id"),
      sitio: Number(attr(tag, "data-sitio")),
      tipo: attr(tag, "data-tipo"),
      codigo: attr(tag, "data-codigo"),
      forma,
    });
  }
  return unidades;
}

function fachadasEn(chunk) {
  const fachadas = [];
  const re = /<polyline\b([^>]*)>([\s\S]*?)<\/polyline>/g;
  let match;
  while ((match = re.exec(chunk))) {
    const tag = match[1];
    const title = match[2].match(/<title>([\s\S]*?)<\/title>/);
    const puntos = pointsOf(attr(tag, "points"));
    const primero = puntos[0];
    const ultimo = puntos[puntos.length - 1];
    fachadas.push({
      id: attr(tag, "id"),
      nombre: title ? title[1].trim() : attr(tag, "id"),
      hacia: attr(tag, "data-hacia"),
      ubicacion: attr(tag, "data-ubicacion"),
      puntos,
      cerrada:
        primero[0] === ultimo[0] &&
        primero[1] === ultimo[1] &&
        puntos.length > 2,
    });
  }
  return fachadas;
}

function tsString(value) {
  return JSON.stringify(value);
}

function tsPuntos(puntos) {
  return `[${puntos.map((p) => `[${p[0]}, ${p[1]}]`).join(", ")}]`;
}

function tsRotulos(rotulos) {
  if (rotulos.length === 0) return "[]";
  return `[${rotulos
    .map(
      (r) =>
        `{ texto: ${tsString(r.texto)}, x: ${r.x}, y: ${r.y}, size: ${r.size}, fill: ${tsString(r.fill)}, textAnchor: ${tsString(r.textAnchor)}${r.rotacion == null ? "" : `, rotacion: ${r.rotacion}`} }`,
    )
    .join(", ")}]`;
}

function tsForma(forma, indent) {
  const pad = " ".repeat(indent);
  return `${pad}{
${pad}  id: ${forma.id ? tsString(forma.id) : "null"},
${pad}  puntos: ${tsPuntos(forma.puntos)},
${pad}  fill: ${tsString(forma.fill)},
${pad}  stroke: ${forma.stroke ? tsString(forma.stroke) : "null"},
${pad}  strokeWidth: ${forma.strokeWidth ?? "null"},
${pad}  dash: ${forma.dash ? tsString(forma.dash) : "null"},
${pad}  rotulos: ${tsRotulos(forma.rotulos)},
${pad}}`;
}

export function construirGeometria(svg) {
  const viewBox = svg.match(/viewBox="([^"]+)"/);
  if (!viewBox) throw new Error("sin viewBox");
  const [, , width, height] = viewBox[1].split(/\s+/).map(Number);
  if (width !== 1594 || height !== 945) {
    throw new Error(`viewBox inesperado: ${viewBox[1]}`);
  }
  const entorno = formasEn(sliceGroup(svg, "entorno"));
  const predio = formasEn(sliceGroup(svg, "predio"));
  const areas = formasEn(sliceGroup(svg, "areas-comunes"));
  const base = [];
  const espacios = [];
  for (const forma of [...entorno, ...predio, ...areas]) {
    if (forma.id && forma.id.startsWith("esp-")) espacios.push(forma);
    else base.push(forma);
  }
  const unidades = unidadesEn(sliceGroup(svg, "unidades"));
  const fachadas = fachadasEn(sliceGroup(svg, "fachadas"));
  if (fachadas.length !== 69) throw new Error(`se esperaban 69 fachadas, hay ${fachadas.length}`);
  if (fachadas.some((f) => f.id.includes("bodega-7") || f.id.includes("bodega-8"))) {
    throw new Error("el plano no puede incluir Bodega 7 u 8");
  }
  const taller = fachadas.find((f) => f.id === "s1-taller-maestros-f1");
  if (!taller?.cerrada || taller.puntos.length < 12) {
    throw new Error("el taller tiene que ser una polyline cerrada");
  }
  if (/<circle\b/.test(sliceGroup(svg, "fachadas"))) {
    throw new Error("las fachadas no pueden ser circle");
  }
  return { width, height, base, espacios, unidades, fachadas };
}

function emitir(doc) {
  const unidades = doc.unidades
    .map(
      (u) => `  {
    id: ${tsString(u.id)},
    sitio: ${u.sitio},
    tipo: ${tsString(u.tipo)},
    codigo: ${tsString(u.codigo)},
    forma: ${tsForma(u.forma, 4).trimStart()},
  }`,
    )
    .join(",\n");
  const fachadas = doc.fachadas
    .map(
      (f) => `  {
    id: ${tsString(f.id)},
    nombre: ${tsString(f.nombre)},
    hacia: ${tsString(f.hacia)},
    ubicacion: ${tsString(f.ubicacion)},
    puntos: ${tsPuntos(f.puntos)},
    cerrada: ${f.cerrada},
  }`,
    )
    .join(",\n");
  return `// Generado por scripts/generar-geometria-plano.mjs. No editar a mano.
// Fuente: docs/diseno/fachadas/v2/plano/plano-bodetek-v2.svg (viewBox 0 0 1594 945).

export type PuntoPlano = readonly [number, number];

export type RotuloPlano = {
  texto: string;
  x: number;
  y: number;
  size: number;
  fill: string;
  textAnchor: "start" | "middle" | "end";
  rotacion?: number;
};

export type FormaPlano = {
  id: string | null;
  puntos: PuntoPlano[];
  fill: string;
  stroke: string | null;
  strokeWidth: number | null;
  dash: string | null;
  rotulos: RotuloPlano[];
};

export type UnidadPlano = {
  id: string;
  sitio: number;
  tipo: string;
  codigo: string;
  forma: FormaPlano;
};

export type FachadaGeometria = {
  id: string;
  nombre: string;
  hacia: string;
  ubicacion: "interior" | "exterior";
  puntos: PuntoPlano[];
  cerrada: boolean;
};

export const VIEWBOX_PLANO = { width: ${doc.width}, height: ${doc.height} } as const;

export const BASE_PLANO: FormaPlano[] = [
${doc.base.map((f) => tsForma(f, 2)).join(",\n")},
];

export const ESPACIOS_PLANO: FormaPlano[] = [
${doc.espacios.map((f) => tsForma(f, 2)).join(",\n")},
];

export const UNIDADES_PLANO: UnidadPlano[] = [
${unidades},
];

export const FACHADAS_PLANO: FachadaGeometria[] = [
${fachadas},
];
`;
}

const esEntrada =
  process.argv[1] != null && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (esEntrada) {
  const svg = readFileSync(svgPath, "utf8");
  const sql = emitir(construirGeometria(svg));
  if (process.argv.includes("--check")) {
    const actual = readFileSync(outPath, "utf8");
    if (actual !== sql) {
      console.error("geometria.ts está desactualizada.");
      process.exit(1);
    }
    console.log("geometria ok");
  } else {
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, sql);
    console.log(`escribí ${path.relative(root, outPath)}`);
  }
}
