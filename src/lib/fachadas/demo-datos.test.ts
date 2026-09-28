import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  agregarIndicadores,
  FILTRO_DASHBOARD_VACIO,
  superficieDashboard,
} from "./indicadores";
import {
  conteosEstado,
  listadoAIndicadores,
} from "./dashboard";
import {
  DEMO_FACHADAS,
  DEMO_HOY,
  DEMO_INTERVENCIONES,
  DEMO_RECINTOS,
} from "./demo-datos";

describe("datos de ejemplo Fachadas (capturas)", () => {
  it("tiene 45 fachadas y 32 recintos", () => {
    assert.equal(DEMO_FACHADAS.length, 45);
    assert.equal(DEMO_RECINTOS.length, 32);
  });

  it("reparte estados como en la captura 1", () => {
    const c = conteosEstado(DEMO_FACHADAS, DEMO_INTERVENCIONES, DEMO_HOY);
    assert.equal(c.total, 45);
    assert.equal(c.al_dia, 18);
    assert.equal(c.en_ejecucion, 4);
    assert.equal(c.programada, 9);
    assert.equal(c.requiere_trabajo, 14);
    assert.equal(c.intervenidas, 22);
  });

  it("superficie intervenida 2.860 de 5.940 m²", () => {
    const filtro = {
      ...FILTRO_DASHBOARD_VACIO,
      fechaDesde: "2026-01-01",
      fechaHasta: DEMO_HOY,
    };
    const s = superficieDashboard(
      DEMO_FACHADAS.map(listadoAIndicadores),
      DEMO_INTERVENCIONES,
      filtro,
    );
    assert.equal(s.m2Totales, 5940);
    assert.equal(s.m2Intervenidos, 2860);
    assert.equal(s.m2Restantes, 3080);
  });

  it("Bodega 14 · A está al día con 111,6 m²", () => {
    const f = DEMO_FACHADAS.find((x) => x.id === "f14A");
    assert.ok(f);
    assert.equal(f.superficieM2, 111.6);
    assert.equal(f.letra, "A");
    assert.equal(f.recintoEtiqueta, "Bodega 14");
    const c = conteosEstado([f], DEMO_INTERVENCIONES, DEMO_HOY);
    assert.equal(c.al_dia, 1);
  });
});

describe("agregados demo (aprox. captura 1)", () => {
  const filtroInts = DEMO_INTERVENCIONES.filter((i) => {
    const fechas = [i.fechaInicio, i.fechaTermino].filter(Boolean) as string[];
    return fechas.some((f) => f >= "2026-01-01" && f <= DEMO_HOY);
  });

  it("incluye la intervención de $2.051.000 de Bodega 14", () => {
    const i = DEMO_INTERVENCIONES.find((x) => x.id === "i-f14A-2026");
    assert.ok(i);
    const dash = agregarIndicadores([i]);
    assert.equal(dash.costos.totalNeto, 2_051_000);
  });

  it("calcula costos, trabajos y quién ejecutó sobre el periodo 2026", () => {
    const dash = agregarIndicadores(filtroInts);
    assert.equal(dash.costos.totalNeto, 18_400_000);
    assert.equal(dash.costos.materialesNeto, 3_900_000);
    assert.equal(dash.costos.hojalateriaNeto, 1_900_000);
    assert.equal(dash.costos.cotizacionesNeto, 12_600_000);
  });
});
