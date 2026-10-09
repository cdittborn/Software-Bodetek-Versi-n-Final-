import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  etiquetaInicioTemporada,
  fechaHastaTemporada,
  finTemporada,
  inicioTemporada,
  opcionesTemporada,
} from "./temporada";

describe("temporada de fachadas", () => {
  it("empieza en julio del año en curso, o del anterior si aún no llega julio", () => {
    assert.equal(inicioTemporada("2026-06-30"), "2025-07-01");
    assert.equal(inicioTemporada("2026-07-01"), "2026-07-01");
    assert.equal(inicioTemporada("2026-10-09"), "2026-07-01");
  });

  it("cierra el 30 de junio siguiente y, en la temporada abierta, corta en hoy", () => {
    assert.equal(finTemporada("2026-07-01"), "2027-06-30");
    assert.equal(fechaHastaTemporada("2026-07-01", "2026-10-09"), "2026-10-09");
    assert.equal(fechaHastaTemporada("2025-07-01", "2026-10-09"), "2026-06-30");
  });

  it("ofrece la temporada actual y las dos anteriores", () => {
    const opciones = opcionesTemporada("2026-10-09");
    assert.deepEqual(
      opciones.map((opcion) => opcion.inicio),
      ["2026-07-01", "2025-07-01", "2024-07-01"],
    );
    assert.equal(etiquetaInicioTemporada(opciones[0].inicio), "jul 2026");
    assert.deepEqual(
      opciones.map((opcion) => opcion.etiqueta),
      [
        "2026 · desde 1 jul 2026",
        "2025 · jul 2025 – jun 2026",
        "2024 · jul 2024 – jun 2025",
      ],
    );
    for (const opcion of opciones) {
      assert.doesNotMatch(opcion.etiqueta, /\d{4}-\d{2}-\d{2}/);
    }
  });

  it("la temporada abierta en junio usa el julio anterior", () => {
    const opciones = opcionesTemporada("2026-06-15");
    assert.equal(opciones[0].etiqueta, "2025 · desde 1 jul 2025");
    assert.equal(opciones[1].etiqueta, "2024 · jul 2024 – jun 2025");
  });
});
