import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { esRutaDemoFachadas, isProtectedDashboardPath, moduloFromPathname } from "../modulos";

describe("demo Fachadas exige login de trabajos", () => {
  it("protege /trabajos/fachadas/demo como módulo trabajos", () => {
    assert.equal(esRutaDemoFachadas("/trabajos/fachadas/demo"), true);
    assert.equal(moduloFromPathname("/trabajos/fachadas/demo"), "trabajos");
    assert.equal(moduloFromPathname("/trabajos/fachadas/demo/ficha"), "trabajos");
    assert.equal(moduloFromPathname("/trabajos/fachadas/demo/reporte"), "trabajos");
    assert.equal(isProtectedDashboardPath("/trabajos/fachadas/demo"), true);
    assert.equal(moduloFromPathname("/demo/fachadas"), "trabajos");
    assert.equal(moduloFromPathname("/demo/fachadas/ficha"), "trabajos");
    assert.equal(isProtectedDashboardPath("/trabajos/fachadas/x/y"), true);
  });

  it("la ruta de capturas locales no pide login y se apaga en producción", () => {
    assert.equal(isProtectedDashboardPath("/dev/fachadas-mobile"), false);
    assert.equal(moduloFromPathname("/dev/fachadas-mobile"), null);
    const src = readFileSync(
      new URL("../../app/dev/fachadas-mobile/[[...vista]]/page.tsx", import.meta.url),
      "utf8",
    );
    assert.match(src, /NODE_ENV === "production"/);
    assert.match(src, /notFound\(\)/);
    const middleware = readFileSync(new URL("../../../middleware.ts", import.meta.url), "utf8");
    assert.match(middleware, /dev\/fachadas-mobile/);
    assert.match(middleware, /updateSession/);
    assert.equal(isProtectedDashboardPath("/dev/fachadas-v2"), false);
    assert.equal(moduloFromPathname("/dev/fachadas-v2"), null);
    assert.match(middleware, /dev\/fachadas-v2/);
    const plano = readFileSync(
      new URL("../../app/dev/fachadas-v2/[[...vista]]/page.tsx", import.meta.url),
      "utf8",
    );
    assert.match(plano, /NODE_ENV === "production"/);
    assert.match(plano, /notFound\(\)/);
  });
});
