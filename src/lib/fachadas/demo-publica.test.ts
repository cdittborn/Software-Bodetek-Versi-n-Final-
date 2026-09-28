import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isProtectedDashboardPath, moduloFromPathname } from "../modulos";

describe("demo Fachadas es pública", () => {
  it("no exige login en /trabajos/fachadas/demo", () => {
    assert.equal(moduloFromPathname("/trabajos/fachadas/demo"), null);
    assert.equal(moduloFromPathname("/trabajos/fachadas/demo/ficha"), null);
    assert.equal(moduloFromPathname("/trabajos/fachadas/demo/reporte"), null);
    assert.equal(isProtectedDashboardPath("/trabajos/fachadas/demo"), false);
    assert.equal(moduloFromPathname("/trabajos"), "trabajos");
    assert.equal(isProtectedDashboardPath("/trabajos/fachadas/x/y"), true);
  });
});
