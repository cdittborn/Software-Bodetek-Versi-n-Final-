import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  agregarPorProyecto,
  aplicarCambioIva,
  aplicarCambioNeto,
  brutoDe,
  brutoDesde,
  estadoIvaVacio,
  faltantesCompra,
  ivaDesdeNeto,
  mensajePieFormulario,
  partesIgualesPorTrabajo,
  parseEnteroClp,
  repartirEntero,
  totalesCompras,
  type CompraMaterial,
} from "./materiales";

function compra(
  extra: Partial<CompraMaterial> & Pick<CompraMaterial, "id" | "trabajoIds">,
): CompraMaterial {
  return {
    eventoId: "ev",
    fechaCompra: "2026-09-01",
    proveedor: "Sodimac",
    numeroFactura: "F-1",
    material: "Canaleta",
    valorNeto: 1000,
    valorIva: 190,
    valorBruto: 1190,
    facturaKey: "compras/x/a.pdf",
    facturaNombre: "a.pdf",
    facturaUrl: null,
    ...extra,
  };
}

describe("IVA automático y bruto", () => {
  it("calcula IVA como 19% del neto redondeado", () => {
    assert.equal(ivaDesdeNeto(480000), 91200);
    assert.equal(ivaDesdeNeto(1000), 190);
    assert.equal(ivaDesdeNeto(1), 0);
    assert.equal(ivaDesdeNeto(3), 1);
  });

  it("bruto es neto + iva", () => {
    assert.equal(brutoDesde(480000, 91200), 571200);
    assert.equal(brutoDesde(1000, 200), 1200);
  });

  it("cambiar el neto recalcula el IVA aunque hubiera edición manual", () => {
    let e = estadoIvaVacio();
    e = aplicarCambioNeto(e, 1000);
    assert.equal(e.iva, 190);
    assert.equal(e.ivaManual, false);
    assert.equal(brutoDe(e), 1190);

    e = aplicarCambioIva(e, 200);
    assert.equal(e.iva, 200);
    assert.equal(e.ivaManual, true);
    assert.equal(brutoDe(e), 1200);

    e = aplicarCambioNeto(e, 2000);
    assert.equal(e.iva, 380);
    assert.equal(e.ivaManual, false);
    assert.equal(brutoDe(e), 2380);
  });

  it("editar el IVA a mano no se sobrescribe si el neto no cambia", () => {
    let e = aplicarCambioNeto(estadoIvaVacio(), 480000);
    e = aplicarCambioIva(e, 90000);
    assert.equal(e.neto, 480000);
    assert.equal(e.iva, 90000);
    assert.equal(brutoDe(e), 570000);
    assert.equal(e.ivaManual, true);
  });
});

describe("reparto en partes iguales", () => {
  it("reparte enteros y el resto va a las primeras partes", () => {
    assert.deepEqual(repartirEntero(1000, 2), [500, 500]);
    assert.deepEqual(repartirEntero(1000, 3), [334, 333, 333]);
    assert.deepEqual(repartirEntero(10, 1), [10]);
    assert.deepEqual(repartirEntero(11, 2), [6, 5]);
    assert.deepEqual(repartirEntero(0, 3), [0, 0, 0]);
  });

  it("neto/iva/bruto de las partes suman el total de la compra", () => {
    const c = compra({
      id: "c1",
      valorNeto: 1000,
      valorIva: 190,
      valorBruto: 1190,
      trabajoIds: ["b", "a"],
    });
    const partes = partesIgualesPorTrabajo(c);
    assert.deepEqual(
      partes.map((p) => p.trabajoId),
      ["a", "b"],
    );
    assert.equal(
      partes.reduce((acc, p) => acc + p.neto, 0),
      1000,
    );
    assert.equal(
      partes.reduce((acc, p) => acc + p.iva, 0),
      190,
    );
    assert.equal(
      partes.reduce((acc, p) => acc + p.bruto, 0),
      1190,
    );
  });

  it("la vista agregada por proyecto usa el reparto, no el total de la compra", () => {
    const c = compra({
      id: "c1",
      valorNeto: 1000,
      valorIva: 190,
      valorBruto: 1190,
      trabajoIds: ["p1", "p2"],
    });
    const filas = agregarPorProyecto([c], [
      { id: "p1", etiqueta: "Bodega 1" },
      { id: "p2", etiqueta: "Bodega 2" },
      { id: "p3", etiqueta: "Bodega 3" },
    ]);
    assert.equal(filas[0].neto, 500);
    assert.equal(filas[1].neto, 500);
    assert.equal(filas[2].neto, 0);
    assert.equal(filas[0].comprasN, 1);
    assert.equal(filas[2].comprasN, 0);
    assert.equal(filas[0].bruto + filas[1].bruto, 1190);
  });
});

describe("validación de campos obligatorios", () => {
  const ok = {
    fechaCompra: "2026-09-01",
    proveedor: "Sodimac",
    numeroFactura: "F-884210",
    material: "Canaleta de zinc 3 m",
    valorNeto: 480000,
    facturaOk: true,
    trabajoIds: ["p1"],
  };

  it("sin faltantes → pie verde", () => {
    const f = faltantesCompra(ok);
    assert.deepEqual(f, []);
    assert.deepEqual(mensajePieFormulario(f), {
      ok: true,
      texto: "Todo listo para guardar",
    });
  });

  it("lista Falta: con los nombres pedidos", () => {
    const f = faltantesCompra({
      fechaCompra: "2026-09-01",
      proveedor: "  ",
      numeroFactura: "",
      material: "",
      valorNeto: null,
      facturaOk: false,
      trabajoIds: [],
    });
    assert.deepEqual(f, [
      "proveedor",
      "N° de factura",
      "material",
      "valor neto",
      "factura adjunta",
      "proyecto asociado",
    ]);
    assert.equal(
      mensajePieFormulario(f).texto,
      "Falta: proveedor, N° de factura, material, valor neto, factura adjunta, proyecto asociado",
    );
    assert.equal(mensajePieFormulario(f).ok, false);
  });
});

describe("parseo y totales", () => {
  it("parsea enteros CLP con puntos de miles", () => {
    assert.equal(parseEnteroClp("480000"), 480000);
    assert.equal(parseEnteroClp("480.000"), 480000);
    assert.equal(parseEnteroClp(""), null);
    assert.equal(parseEnteroClp("-1"), null);
  });

  it("totales del evento suman la compra completa (no el reparto)", () => {
    const t = totalesCompras([
      compra({ id: "a", trabajoIds: ["p1", "p2"], facturaKey: "k" }),
      compra({
        id: "b",
        trabajoIds: ["p1"],
        valorNeto: 100,
        valorIva: 19,
        valorBruto: 119,
        facturaKey: null,
      }),
    ]);
    assert.equal(t.n, 2);
    assert.equal(t.neto, 1100);
    assert.equal(t.iva, 209);
    assert.equal(t.bruto, 1309);
    assert.equal(t.sinFactura, 1);
  });
});
