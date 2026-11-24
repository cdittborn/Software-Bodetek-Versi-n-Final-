import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  claveLegacyCategoria,
  claveLegacySubtipo,
  faltaColumnaNueva,
  ordenMenuLegacy,
} from "./columnas";
import { CLAVE_SUBTIPO } from "@/lib/trabajos";
import { colorCategoria } from "@/lib/menu";

describe("columnas del menú antes de la migración", () => {
  it("reconoce que la columna todavía no existe", () => {
    assert.equal(faltaColumnaNueva(null), false);
    assert.equal(faltaColumnaNueva({ code: "42703", message: "column archivada does not exist" }), true);
    assert.equal(
      faltaColumnaNueva({ code: "PGRST204", message: "Could not find the 'clave' column in the schema cache" }),
      true,
    );
    assert.equal(faltaColumnaNueva({ code: "42501", message: "permission denied" }), false);
  });

  it("traduce los nombres actuales a la clave, y deja el resto sin clave", () => {
    assert.equal(claveLegacySubtipo("Lluvias y temporales"), CLAVE_SUBTIPO.lluviasTemporales);
    assert.equal(claveLegacySubtipo("Emergencias"), CLAVE_SUBTIPO.lluviasTemporales);
    assert.equal(claveLegacySubtipo("Fachadas"), CLAVE_SUBTIPO.fachadas);
    assert.equal(claveLegacySubtipo("Letreros de locales"), null);
    assert.equal(claveLegacyCategoria("Otros trabajos CD"), "otros_trabajos_cd");
    assert.equal(claveLegacyCategoria("Imagen"), null);
  });

  it("ordena como el menú de hoy: Techumbres, el resto alfabético, Otros al final", () => {
    const orden = ordenMenuLegacy([
      { nombre: "Otros trabajos CD" },
      { nombre: "Seguridad" },
      { nombre: "Imagen" },
      { nombre: "Techumbres y canales" },
      { nombre: "Otros" },
    ]).map((c) => c.nombre);
    assert.deepEqual(orden, ["Techumbres y canales", "Imagen", "Seguridad", "Otros", "Otros trabajos CD"]);
  });

  it("sin color guardado usa el color de la posición", () => {
    assert.equal(colorCategoria(null, 0).color, "#5E87D6");
    assert.equal(colorCategoria("#C7707D", 0).color, "#C7707D");
  });
});
