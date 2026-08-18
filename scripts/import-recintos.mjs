/**
 * Importa data/recintos_import.csv a public.recintos.
 *
 *   node scripts/import-recintos.mjs          # valida, no inserta
 *   node scripts/import-recintos.mjs --apply  # INSERT ... ON CONFLICT
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TIPOS = new Set([
  "local",
  "bodega",
  "estacionamiento",
  "area_comun",
  "oficina",
]);

const NUMERIC_COLS = [
  "superficie_1er_piso",
  "superficie_2o_piso",
  "superficie_m2",
];

const EXPECTED_HEADERS = [
  "sitio",
  "galpon",
  "codigo",
  "nombre",
  "tipo",
  "arrendatario_actual",
  "superficie_1er_piso",
  "superficie_2o_piso",
  "superficie_m2",
];

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = path.join(root, "data", "recintos_import.csv");
const apply = process.argv.includes("--apply");

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) throw new Error("CSV vacío");

  const headers = splitCsvLine(lines[0]);
  if (headers.join(",") !== EXPECTED_HEADERS.join(",")) {
    throw new Error(
      `Encabezados inesperados.\nEsperado: ${EXPECTED_HEADERS.join(",")}\nRecibido: ${headers.join(",")}`,
    );
  }

  return lines.slice(1).map((line, i) => {
    const cols = splitCsvLine(line);
    if (cols.length !== headers.length) {
      throw new Error(`Fila ${i + 2}: ${cols.length} columnas, se esperaban ${headers.length}`);
    }
    const row = {};
    for (const [j, h] of headers.entries()) row[h] = cols[j];
    return { line: i + 2, row };
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function sqlText(value) {
  if (value == null) return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function parseNumeric(raw, col, line, issues) {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(n)) {
    issues.push(`Línea ${line}: ${col} no es número (${JSON.stringify(raw)})`);
    return null;
  }
  const rounded = Math.round(n * 100) / 100;
  if (Math.abs(n - rounded) > 1e-9) {
    issues.push(
      `Línea ${line}: ${col}=${n} se redondea a ${rounded} (ruido de Excel)`,
    );
  }
  return rounded;
}

function normalizeRow({ line, row }, issues) {
  const sitio = row.sitio.trim();
  const galpon = row.galpon.trim();
  const codigo = row.codigo.trim();
  const nombre = row.nombre.trim();
  const tipo = row.tipo.trim();
  const arrendatario = row.arrendatario_actual.trim();

  if (!sitio) issues.push(`Línea ${line}: sitio vacío`);
  if (!codigo) issues.push(`Línea ${line}: codigo vacío`);
  if (!nombre) issues.push(`Línea ${line}: nombre vacío`);
  if (!tipo) issues.push(`Línea ${line}: tipo vacío`);
  else if (!TIPOS.has(tipo)) {
    issues.push(`Línea ${line}: tipo inválido "${tipo}"`);
  }

  if (/\s{2,}/.test(galpon)) {
    issues.push(
      `Línea ${line}: galpon con espacios dobles (${JSON.stringify(galpon)})`,
    );
  }

  const superficie_1er_piso = parseNumeric(
    row.superficie_1er_piso,
    "superficie_1er_piso",
    line,
    issues,
  );
  const superficie_2o_piso = parseNumeric(
    row.superficie_2o_piso,
    "superficie_2o_piso",
    line,
    issues,
  );
  const superficie_m2 = parseNumeric(
    row.superficie_m2,
    "superficie_m2",
    line,
    issues,
  );

  if (
    superficie_1er_piso != null &&
    superficie_2o_piso != null &&
    superficie_m2 != null
  ) {
    const suma = Math.round((superficie_1er_piso + superficie_2o_piso) * 100) / 100;
    if (Math.abs(suma - superficie_m2) > 0.02) {
      issues.push(
        `Línea ${line} (${codigo}): superficie_m2=${superficie_m2} ≠ 1er+2o=${suma}`,
      );
    }
  }

  return {
    sitio,
    galpon,
    codigo,
    nombre,
    tipo: tipo || null,
    arrendatario_actual: arrendatario || null,
    superficie_1er_piso,
    superficie_2o_piso,
    superficie_m2,
  };
}

const raw = fs.readFileSync(csvPath, "utf8");
const parsed = parseCsv(raw);
const issues = [];
const recintos = parsed.map((item) => normalizeRow(item, issues));

const seen = new Map();
for (const r of recintos) {
  const key = `${r.sitio}\0${r.galpon}\0${r.codigo}`;
  if (seen.has(key)) {
    issues.push(
      `Duplicado (sitio, galpon, codigo)=(${r.sitio}, ${r.galpon}, ${r.codigo})`,
    );
  }
  seen.set(key, true);
}

const tipos = {};
for (const r of recintos) {
  tipos[r.tipo ?? "null"] = (tipos[r.tipo ?? "null"] ?? 0) + 1;
}

console.log(`CSV: ${csvPath}`);
console.log(`Filas: ${recintos.length}`);
console.log(`Tipos: ${JSON.stringify(tipos)}`);
console.log(`Hallazgos: ${issues.length === 0 ? "ninguno" : issues.length}`);
for (const issue of issues) console.log(`  - ${issue}`);

if (!apply) {
  console.log("\nDry-run. Nada insertado. Para importar: node scripts/import-recintos.mjs --apply");
  process.exit(issues.some((i) => i.includes("inválido") || i.includes("vacío") || i.includes("Duplicado")) ? 1 : 0);
}

const values = recintos
  .map(
    (r) =>
      `(${sqlText(r.sitio)}, ${sqlText(r.galpon)}, ${sqlText(r.codigo)}, ${sqlText(r.nombre)}, ${sqlText(r.tipo)}, ${sqlText(r.arrendatario_actual)}, ${r.superficie_1er_piso ?? "null"}, ${r.superficie_2o_piso ?? "null"}, ${r.superficie_m2 ?? "null"})`,
  )
  .join(",\n");

const sql = `-- generado por scripts/import-recintos.mjs
insert into public.recintos (
  sitio,
  galpon,
  codigo,
  nombre,
  tipo,
  arrendatario_actual,
  superficie_1er_piso,
  superficie_2o_piso,
  superficie_m2
)
values
${values}
on conflict (sitio, galpon, codigo) do update set
  nombre = excluded.nombre,
  tipo = excluded.tipo,
  arrendatario_actual = excluded.arrendatario_actual,
  superficie_1er_piso = excluded.superficie_1er_piso,
  superficie_2o_piso = excluded.superficie_2o_piso,
  superficie_m2 = excluded.superficie_m2,
  updated_at = now();
`;

const tmp = path.join(os.tmpdir(), "bodetek-import-recintos.sql");
fs.writeFileSync(tmp, sql, "utf8");

const result = spawnSync(
  "npx",
  ["supabase", "db", "query", "--linked", "--yes", "-f", tmp],
  { cwd: root, stdio: "inherit", shell: true },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Importados ${recintos.length} recintos (upsert por sitio, galpon, codigo).`);
