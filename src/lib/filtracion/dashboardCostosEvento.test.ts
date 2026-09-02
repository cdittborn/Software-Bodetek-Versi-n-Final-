import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatMontoClp } from "../trabajos";
import {
  costoTotalEstimadoEvento,
  totalMaterialesDeCompras,
  totalMaterialesVacio,
} from "./dashboardCostosEvento";

describe("dashboard costos evento — materiales", () => {
  it("suma valor bruto de cada compra una vez", () => {
    const t = totalMaterialesDeCompras([
      {
        id: "c1",
        valorBruto: 1000000,
        proveedor: "Sodimac",
        material: "Plancha zinc",
        numeroFactura: "F-1",
      },
      {
        id: "c2",
        valorBruto: 850000,
        proveedor: "Construmart",
        material: "Tornillos",
        numeroFactura: "F-2",
      },
    ]);
    assert.equal(t.total, 1850000);
    assert.equal(formatMontoClp(t.total), "$1.850.000");
    assert.equal(t.n, 2);
    assert.equal(t.items.length, 2);
  });

  it("una compra ligada a varios trabajos no se cuenta dos veces", () => {
    const misma = {
      id: "c1",
      valorBruto: 500000,
      proveedor: "Sodimac",
      material: "Yeso",
    };
    const t = totalMaterialesDeCompras([misma, { ...misma }]);
    assert.equal(t.total, 500000);
    assert.equal(t.n, 1);
  });

  it("sin compras es $0, sin error", () => {
    const t = totalMaterialesDeCompras([]);
    assert.deepEqual(t, totalMaterialesVacio());
    assert.equal(t.total, 0);
    assert.equal(t.n, 0);
    assert.equal(formatMontoClp(t.total), "$0");
  });
});

describe("dashboard costos evento — total estimado", () => {
  it("suma cotizaciones (valor recinto) + materiales", () => {
    const c = costoTotalEstimadoEvento(1850000, 500000);
    assert.equal(c.cotizaciones, 1850000);
    assert.equal(c.materiales, 500000);
    assert.equal(c.total, 2350000);
    assert.equal(formatMontoClp(c.total), "$2.350.000");
  });

  it("si no hay materiales, el total es solo cotizaciones", () => {
    const c = costoTotalEstimadoEvento(1850000, 0);
    assert.equal(c.total, 1850000);
    assert.equal(c.materiales, 0);
  });

  it("si no hay cotizaciones ni compras, el total es $0", () => {
    const c = costoTotalEstimadoEvento(0, 0);
    assert.equal(c.total, 0);
    assert.equal(formatMontoClp(c.total), "$0");
  });

  it("no mezcla horas (unidades distintas) en el total de dinero", () => {
    const horas = 4.5;
    const c = costoTotalEstimadoEvento(1000, 2000);
    assert.equal(c.total, 3000);
    assert.notEqual(c.total, 1000 + 2000 + horas);
  });
});
