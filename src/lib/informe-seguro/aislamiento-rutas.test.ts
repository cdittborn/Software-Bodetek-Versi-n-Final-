import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../../", import.meta.url));
const ROOT = join(SRC, "..");
const SHARED_PAGE = join(
  SRC,
  "app/(dashboard)/trabajos/c/[categoriaId]/s/[subtipoId]/page.tsx",
);
const PUBLIC_PAGE = join(SRC, "app/informe-seguro/[token]/page.tsx");
const DEV_PAGE = join(SRC, "app/dev/informe-seguro/page.tsx");

const IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?from\s*)?['"]([^'"]+)['"]/g;
const DYNAMIC_IMPORT_RE = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

function extraerSpecs(source: string): string[] {
  const specs: string[] = [];
  const sinComentarios = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
  for (const re of [IMPORT_RE, DYNAMIC_IMPORT_RE]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sinComentarios))) specs.push(m[1]);
  }
  return specs;
}

function resolverArchivo(base: string): string | null {
  const candidatos = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ];
  for (const c of candidatos) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

function resolverSpec(fromFile: string, spec: string): string | null {
  if (spec.startsWith("@/")) return resolverArchivo(join(SRC, spec.slice(2)));
  if (spec.startsWith(".")) return resolverArchivo(join(dirname(fromFile), spec));
  return null;
}

function grafo(entry: string): string[] {
  const queue = [entry];
  const seen = new Set<string>();
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file) || !file.startsWith(SRC) || !existsSync(file)) continue;
    seen.add(file);
    for (const spec of extraerSpecs(readFileSync(file, "utf8"))) {
      const next = resolverSpec(file, spec);
      if (next) queue.push(next);
    }
  }
  return [...seen];
}

function esInforme(file: string): boolean {
  return file.includes(`${join("lib", "informe-seguro")}`) ||
    file.includes(`${join("components", "informe-seguro")}`) ||
    file.includes(`${join("app", "informe-seguro")}`);
}

describe("aislamiento del informe para seguro", () => {
  it("la página compartida de subtipos no carga el informe", () => {
    const leaks = grafo(SHARED_PAGE).filter(esInforme).map((f) => relative(ROOT, f));
    assert.deepEqual(leaks, []);
  });

  it("la ruta pública no vive en el dashboard y no carga Lluvias", () => {
    assert.equal(existsSync(PUBLIC_PAGE), true);
    assert.equal(PUBLIC_PAGE.includes("(dashboard)"), false);
    const archivos = grafo(PUBLIC_PAGE);
    const prohibido = archivos.filter((file) => {
      const rel = relative(SRC, file);
      return (
        rel.includes("cargarDatosEventoFiltracion") ||
        rel.startsWith("components/emergencias") ||
        rel.endsWith("components/shared/NavPrincipal.tsx") ||
        rel.includes("filtracion/dashboardFaltantes")
      );
    });
    assert.deepEqual(
      prohibido.map((f) => relative(ROOT, f)),
      [],
    );
  });

  it("la demo local no lee la base y no existe dentro del dashboard", () => {
    assert.equal(existsSync(DEV_PAGE), true);
    assert.equal(DEV_PAGE.includes("(dashboard)"), false);
    const src = readFileSync(DEV_PAGE, "utf8");
    assert.match(src, /NODE_ENV/);
    const leaks = grafo(DEV_PAGE).filter(
      (file) =>
        file.endsWith("supabase/server.ts") ||
        file.endsWith("supabase/admin.ts"),
    );
    assert.deepEqual(leaks, []);
    const pages = readdirSync(join(SRC, "app/(dashboard)/trabajos/c/[categoriaId]/s/[subtipoId]"));
    assert.equal(pages.includes("informe"), false);
  });
});
