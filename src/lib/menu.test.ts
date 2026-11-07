import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  colorPorPosicion,
  etiquetaRol,
  fechaMenu,
  moduloActivo,
  PALETA_CATEGORIAS,
  subtipoActivo,
} from "./menu";

describe("menú lateral", () => {
  it("la fecha sale en hora de Chile, no en UTC", () => {
    assert.equal(fechaMenu(new Date("2026-11-02T15:00:00Z")), "Lunes 2 de noviembre");
    assert.equal(fechaMenu(new Date("2026-11-03T02:30:00Z")), "Lunes 2 de noviembre");
  });

  it("la paleta tiene 7 colores y se repite en orden", () => {
    assert.equal(PALETA_CATEGORIAS.length, 7);
    assert.deepEqual(colorPorPosicion(0), { color: "#5E87D6", tinte: "#C9D8F2" });
    assert.deepEqual(colorPorPosicion(7), colorPorPosicion(0));
  });

  it("el rol interno no aparece en pantalla", () => {
    assert.equal(etiquetaRol("admin"), "Gerente General");
    assert.equal(etiquetaRol("pablo"), "Administrador");
    assert.equal(etiquetaRol("asistente"), "Ver y editar");
    assert.equal(etiquetaRol("socio"), "Solo ver");
    assert.equal(etiquetaRol("cliente"), "Consulta");
    assert.equal(etiquetaRol(null), "");
    for (const rol of ["admin", "pablo", "asistente", "socio", "cliente"]) {
      assert.equal(etiquetaRol(rol).toLowerCase().includes(rol), false);
    }
  });

  it("marca la subcategoría activa también en sus páginas hijas y en la ruta de Fachadas", () => {
    assert.equal(subtipoActivo("/trabajos/c/a/s/b", "a", "b"), true);
    assert.equal(subtipoActivo("/trabajos/c/a/s/b/e/x/dashboard", "a", "b"), true);
    assert.equal(subtipoActivo("/trabajos/fachadas/a/b/f/z", "a", "b"), true);
    assert.equal(subtipoActivo("/trabajos/c/a/s/bb", "a", "b"), false);
    assert.equal(subtipoActivo("/trabajos", "a", "b"), false);
  });

  it("el módulo activo no confunde prefijos parecidos", () => {
    assert.equal(moduloActivo("/recintos/plano", "/recintos"), true);
    assert.equal(moduloActivo("/trabajos", "/trabajos"), true);
    assert.equal(moduloActivo("/trabajosx", "/trabajos"), false);
  });
});
