import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { esErrorRls, mensajeFalloSubida } from "./error-subida";

describe("mensajes de fallo de subida", () => {
  it("nombra el paso y el código HTTP", () => {
    assert.equal(mensajeFalloSubida("firmar", 401), "Error al pedir la URL firmada (401)");
    assert.equal(mensajeFalloSubida("firmar", 500), "Error al pedir la URL firmada (500)");
    assert.equal(mensajeFalloSubida("r2", 403), "Error al subir a R2 (403)");
    assert.equal(mensajeFalloSubida("r2", 0), "Error al subir a R2 (red/CORS)");
    assert.equal(mensajeFalloSubida("r2", null), "Error al subir a R2 (red/CORS)");
    assert.equal(mensajeFalloSubida("guardar", null, { rls: true }), "Error al guardar (RLS)");
    assert.equal(mensajeFalloSubida("guardar", 23505), "Error al guardar (23505)");
  });

  it("reconoce un rechazo de RLS", () => {
    assert.equal(esErrorRls({ code: "42501", message: "permission denied" }), true);
    assert.equal(
      esErrorRls({
        message: 'new row violates row-level security policy for table "fachada_archivos"',
      }),
      true,
    );
    assert.equal(esErrorRls({ code: "23505", message: "duplicate key" }), false);
  });
});
