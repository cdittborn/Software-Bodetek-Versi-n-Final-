import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { esRutaDemoFachadas, isProtectedDashboardPath, moduloFromPathname } from "../modulos";

describe("demo Fachadas exige login de trabajos", () => {
  it("protege /trabajos/fachadas/demo como módulo trabajos", () => {
    assert.equal(esRutaDemoFachadas("/trabajos/fachadas/demo"), true);
    assert.equal(moduloFromPathname("/trabajos/fachadas/demo"), "trabajos");
    assert.equal(moduloFromPathname("/trabajos/fachadas/demo/ficha"), "trabajos");
    assert.equal(moduloFromPathname("/trabajos/fachadas/demo/reporte"), "trabajos");
    assert.equal(isProtectedDashboardPath("/trabajos/fachadas/demo"), true);
    assert.equal(moduloFromPathname("/trabajos"), "trabajos");
    assert.equal(isProtectedDashboardPath("/trabajos/fachadas/x/y"), true);
  });
});
