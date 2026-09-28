import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../../", import.meta.url));
const ROOT = join(SRC, "..");
const SHARED_PAGE = join(
  SRC,
  "app/(dashboard)/trabajos/c/[categoriaId]/s/[subtipoId]/page.tsx",
);
const SHARED_DIR = dirname(SHARED_PAGE);
const FACHADAS_LEAK =
  /(?:^|\/)(?:components|lib|app)\/(?:\(\w+\)\/)*fachadas(?:\/|$)/;

const IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?from\s*)?['"]([^'"]+)['"]/g;
const DYNAMIC_IMPORT_RE = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

function esSpecFachadas(spec: string): boolean {
  if (spec.includes("/fachadas/") || spec.endsWith("/fachadas")) return true;
  if (spec === "@/lib/fachadas" || spec === "@/components/fachadas") return true;
  return FACHADAS_LEAK.test(spec.replace(/^@\//, ""));
}

function extraerSpecs(source: string): string[] {
  const specs: string[] = [];
  const sinComentarios = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
  for (const re of [IMPORT_RE, DYNAMIC_IMPORT_RE]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sinComentarios))) {
      specs.push(m[1]);
    }
  }
  return specs;
}

function resolverSpec(fromFile: string, spec: string): string | null {
  if (spec.startsWith("@/")) {
    return resolverArchivo(join(SRC, spec.slice(2)));
  }
  if (spec.startsWith(".")) {
    return resolverArchivo(join(dirname(fromFile), spec));
  }
  return null;
}

function resolverArchivo(base: string): string | null {
  const candidatos = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ];
  for (const c of candidatos) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

function grafoDesde(entry: string): { file: string; spec: string }[] {
  const queue = [entry];
  const seen = new Set<string>();
  const leaks: { file: string; spec: string }[] = [];
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    if (!file.startsWith(SRC) || !existsSync(file)) continue;
    const source = readFileSync(file, "utf8");
    for (const spec of extraerSpecs(source)) {
      if (esSpecFachadas(spec)) {
        leaks.push({ file, spec });
        continue;
      }
      const resolved = resolverSpec(file, spec);
      if (resolved) queue.push(resolved);
    }
  }
  return leaks;
}

function listarRutas(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...listarRutas(full));
      continue;
    }
    if (["page.tsx", "layout.tsx", "error.tsx", "loading.tsx"].includes(name)) {
      out.push(full);
    }
  }
  return out;
}

describe("aislamiento: página compartida de subtipos vs Fachadas", () => {
  it("no deja la ficha de Fachadas bajo el segmento c/.../s/... compartido con Lluvias", () => {
    const ficha = join(SHARED_DIR, "f");
    assert.equal(
      existsSync(ficha),
      false,
      `La ficha no puede vivir en ${relative(ROOT, ficha)}: Next carga ese árbol en el mismo segmento que Lluvias.`,
    );
  });

  it("ningún page/layout/error/loading del segmento compartido importa Fachadas", () => {
    const filtradas = listarRutas(SHARED_DIR).flatMap((file) => {
      const specs = extraerSpecs(readFileSync(file, "utf8")).filter(esSpecFachadas);
      return specs.map((spec) => `${relative(ROOT, file)} → ${spec}`);
    });
    assert.deepEqual(
      filtradas,
      [],
      `El segmento compartido no puede importar Fachadas:\n${filtradas.join("\n")}`,
    );
  });

  it("el grafo de imports de page.tsx no alcanza código de Fachadas (otro subtipo)", () => {
    const leaks = grafoDesde(SHARED_PAGE).map(
      ({ file, spec }) => `${relative(ROOT, file)} → ${spec}`,
    );
    assert.deepEqual(
      leaks,
      [],
      `La página compartida arrastra Fachadas:\n${leaks.join("\n")}`,
    );
  });
});
