import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ESTADO_TRABAJO_LABEL } from "@/lib/trabajos";
import {
  estadoFachadaDesdeDb,
  estadoFachadaHaciaDb,
  labelEstadoFachada,
} from "./estado";
import {
  agregarIndicadores,
  aplicarCambioAlto,
  aplicarCambioAncho,
  aplicarCambioSuperficie,
  actualizarSnapshotDesdeFachada,
  conservarSnapshotAlEditar,
  copiarSnapshotAlCrear,
  debeAdvertirCambioEjecutor,
  duracionCalendarioDias,
  esCompletaParaCostos,
  esCompletaParaDias,
  estadoMedidasVacio,
  FILTRO_RUBRO_TODOS,
  hintSuperficie,
  proveedorPasaFiltroRubro,
  snapshotDesdeMedidas,
  superficieSugerida,
  tiposSinCotizacion,
  type IntervencionIndicadores,
} from "./indicadores";

function intervencion(
  extra: Partial<IntervencionIndicadores> &
    Pick<IntervencionIndicadores, "id" | "fachadaId">,
): IntervencionIndicadores {
  return {
    recintoId: "r1",
    ejecutadoPor: "proveedor_externo",
    requiereHojalateria: false,
    sinMateriales: false,
    fechaInicio: "2026-03-01",
    fechaTermino: "2026-03-10",
    altoMSnapshot: 4,
    anchoMSnapshot: 10,
    superficieM2Snapshot: 40,
    altoMActual: 4,
    anchoMActual: 10,
    superficieM2Actual: 40,
    tipos: [{ tipo: "pintura", dias: 5 }],
    cotizaciones: [
      {
        valorNeto: 100_000,
        valorBruto: 119_000,
        cotizacionKey: "fachadas/f/intervenciones/i/docs/c.pdf",
        facturaKey: "fachadas/f/intervenciones/i/docs/f.pdf",
        tipos: ["pintura"],
      },
    ],
    hojalaterias: [],
    materiales: [],
    ...extra,
  };
}

describe("m² manual vs alto × ancho", () => {
  it("sugiere alto × ancho redondeado a 2 decimales", () => {
    assert.equal(superficieSugerida(2, 3), 6);
    assert.equal(superficieSugerida(2.5, 3.3), 8.25);
    assert.equal(superficieSugerida(null, 3), null);
    assert.equal(superficieSugerida(0, 3), null);
  });

  it("autocompleta superficie mientras no se edite a mano", () => {
    let e = estadoMedidasVacio();
    e = aplicarCambioAlto(e, 4);
    assert.equal(e.superficieM2, null);
    e = aplicarCambioAncho(e, 10);
    assert.equal(e.superficieM2, 40);
    assert.equal(e.superficieManual, false);
    e = aplicarCambioAlto(e, 5);
    assert.equal(e.superficieM2, 50);
  });

  it("si el usuario edita m², se respeta aunque cambien alto o ancho", () => {
    let e = aplicarCambioAncho(aplicarCambioAlto(estadoMedidasVacio(), 4), 10);
    e = aplicarCambioSuperficie(e, 32);
    assert.equal(e.superficieManual, true);
    assert.equal(e.superficieM2, 32);
    e = aplicarCambioAlto(e, 6);
    assert.equal(e.superficieM2, 32);
    e = aplicarCambioAncho(e, 12);
    assert.equal(e.superficieM2, 32);
  });

  it("muestra hint solo cuando alto×ancho difiere de la superficie", () => {
    assert.equal(hintSuperficie(4, 10, 40), null);
    assert.equal(hintSuperficie(4, 10, 32), "alto × ancho = 40 m²");
    assert.equal(hintSuperficie(2.5, 3.3, 8), "alto × ancho = 8.25 m²");
    assert.equal(hintSuperficie(4, null, 40), null);
  });

  it("el snapshot copia las tres medidas (manual o sugerida)", () => {
    let e = aplicarCambioAncho(aplicarCambioAlto(estadoMedidasVacio(), 4), 10);
    assert.deepEqual(snapshotDesdeMedidas(e), {
      altoMSnapshot: 4,
      anchoMSnapshot: 10,
      superficieM2Snapshot: 40,
    });
    e = aplicarCambioSuperficie(e, 32);
    assert.deepEqual(snapshotDesdeMedidas(e), {
      altoMSnapshot: 4,
      anchoMSnapshot: 10,
      superficieM2Snapshot: 32,
    });
  });
});

describe("snapshot vs medida actual", () => {
  it("los indicadores usan el snapshot, no la medida viva de la fachada", () => {
    const i = intervencion({
      id: "i1",
      fachadaId: "f1",
      altoMSnapshot: 4,
      anchoMSnapshot: 10,
      superficieM2Snapshot: 32,
      altoMActual: 8,
      anchoMActual: 20,
      superficieM2Actual: 160,
    });
    const dash = agregarIndicadores([i]);
    assert.equal(dash.dias.m2, 32);
    assert.notEqual(dash.dias.m2, 160);
  });

  it("el snapshot no cambia al editar la fachada; solo con la acción explícita", () => {
    let fachada = aplicarCambioAncho(aplicarCambioAlto(estadoMedidasVacio(), 4), 10);
    const snap = copiarSnapshotAlCrear(fachada);
    fachada = aplicarCambioAlto(fachada, 8);
    assert.equal(fachada.superficieM2, 80);
    const conservado = conservarSnapshotAlEditar(snap, fachada);
    assert.deepEqual(conservado, {
      altoMSnapshot: 4,
      anchoMSnapshot: 10,
      superficieM2Snapshot: 40,
    });
    const i = intervencion({
      id: "i1",
      fachadaId: "f1",
      ...conservado,
      altoMActual: fachada.altoM,
      anchoMActual: fachada.anchoM,
      superficieM2Actual: fachada.superficieM2,
    });
    assert.equal(agregarIndicadores([i]).dias.m2, 40);
    const refresco = actualizarSnapshotDesdeFachada(fachada);
    assert.deepEqual(refresco, {
      altoMSnapshot: 8,
      anchoMSnapshot: 10,
      superficieM2Snapshot: 80,
    });
  });

  it("si la misma fachada tiene varias intervenciones, el m² cuenta una sola vez", () => {
    const a = intervencion({
      id: "i1",
      fachadaId: "f1",
      superficieM2Snapshot: 40,
      tipos: [{ tipo: "pintura", dias: 2 }],
    });
    const b = intervencion({
      id: "i2",
      fachadaId: "f1",
      superficieM2Snapshot: 50,
      tipos: [{ tipo: "limpieza", dias: 1 }],
    });
    const dash = agregarIndicadores([a, b]);
    assert.equal(dash.dias.m2, 50);
    assert.equal(dash.dias.total, 3);
    assert.equal(dash.dias.porTipo.pintura, 2);
    assert.equal(dash.dias.porTipo.limpieza, 1);
  });

  it("una fachada sin recinto entra igual en los indicadores", () => {
    const i = intervencion({
      id: "general",
      fachadaId: "f-general",
      recintoId: null,
    });
    const dash = agregarIndicadores([i]);
    assert.equal(dash.dias.m2, 40);
    assert.equal(dash.dias.cobertura.m, 1);
    assert.equal(dash.costos.cobertura.m, 1);
  });
});

describe("completitud para días", () => {
  it("exige snapshot m² > 0 y ≥1 tipo con días", () => {
    const ok = intervencion({ id: "ok", fachadaId: "f" });
    assert.equal(esCompletaParaDias(ok), true);

    assert.equal(
      esCompletaParaDias(
        intervencion({
          id: "sin-m2",
          fachadaId: "f",
          superficieM2Snapshot: 0,
        }),
      ),
      false,
    );
    assert.equal(
      esCompletaParaDias(
        intervencion({
          id: "sin-snapshot",
          fachadaId: "f",
          superficieM2Snapshot: null,
        }),
      ),
      false,
    );
    assert.equal(
      esCompletaParaDias(
        intervencion({
          id: "sin-tipos",
          fachadaId: "f",
          tipos: [],
        }),
      ),
      false,
    );
    assert.equal(
      esCompletaParaDias(
        intervencion({
          id: "dias-cero",
          fachadaId: "f",
          tipos: [{ tipo: "pintura", dias: 0 }],
        }),
      ),
      false,
    );
  });
});

describe("completitud para costos", () => {
  it("exige ejecutor definido", () => {
    const sin = intervencion({
      id: "i",
      fachadaId: "f",
      ejecutadoPor: null,
    });
    assert.equal(esCompletaParaCostos(sin), false);
  });

  it("proveedor externo: ≥1 cotización con neto y PDF", () => {
    const ok = intervencion({ id: "ok", fachadaId: "f" });
    assert.equal(esCompletaParaCostos(ok), true);

    assert.equal(
      esCompletaParaCostos(
        intervencion({
          id: "sin-pdf",
          fachadaId: "f",
          cotizaciones: [
            {
              valorNeto: 100_000,
              valorBruto: 119_000,
              cotizacionKey: null,
              facturaKey: null,
              tipos: ["pintura"],
            },
          ],
        }),
      ),
      false,
    );
    assert.equal(
      esCompletaParaCostos(
        intervencion({
          id: "sin-neto",
          fachadaId: "f",
          cotizaciones: [
            {
              valorNeto: 0,
              valorBruto: 0,
              cotizacionKey: "k.pdf",
              facturaKey: "f.pdf",
              tipos: ["pintura"],
            },
          ],
        }),
      ),
      false,
    );
    assert.equal(
      esCompletaParaCostos(
        intervencion({
          id: "sin-cotiz",
          fachadaId: "f",
          cotizaciones: [],
        }),
      ),
      false,
    );
  });

  it("cotización sin factura suma al costo y cuenta en M de N facturas", () => {
    const i = intervencion({
      id: "sin-fact",
      fachadaId: "f",
      cotizaciones: [
        {
          valorNeto: 100_000,
          valorBruto: 119_000,
          cotizacionKey: "c.pdf",
          facturaKey: null,
          tipos: ["pintura"],
        },
      ],
    });
    assert.equal(esCompletaParaCostos(i), true);
    const dash = agregarIndicadores([i]);
    assert.equal(dash.costos.cotizacionesNeto, 100_000);
    assert.equal(dash.costos.totalBruto, 119_000);
    assert.deepEqual(dash.costos.facturas, { m: 0, n: 1 });
  });

  it("si requiere hojalatería, exige ≥1 registro con neto y proveedor", () => {
    const sin = intervencion({
      id: "sin-h",
      fachadaId: "f",
      requiereHojalateria: true,
      hojalaterias: [],
    });
    assert.equal(esCompletaParaCostos(sin), false);

    const incompleta = intervencion({
      id: "h-incompleta",
      fachadaId: "f",
      requiereHojalateria: true,
      hojalaterias: [{ proveedorId: null, valorNeto: 50_000, valorBruto: 59_500 }],
    });
    assert.equal(esCompletaParaCostos(incompleta), false);

    const ok = intervencion({
      id: "h-ok",
      fachadaId: "f",
      requiereHojalateria: true,
      hojalaterias: [
        { proveedorId: "prov-h", valorNeto: 50_000, valorBruto: 59_500 },
      ],
    });
    assert.equal(esCompletaParaCostos(ok), true);
  });

  it("Maestros Bodetek: ≥1 material o sin_materiales", () => {
    const vacio = intervencion({
      id: "m-vacio",
      fachadaId: "f",
      ejecutadoPor: "maestros_bodetek",
      cotizaciones: [],
      materiales: [],
      sinMateriales: false,
    });
    assert.equal(esCompletaParaCostos(vacio), false);

    const conFlag = intervencion({
      id: "m-flag",
      fachadaId: "f",
      ejecutadoPor: "maestros_bodetek",
      cotizaciones: [],
      materiales: [],
      sinMateriales: true,
    });
    assert.equal(esCompletaParaCostos(conFlag), true);

    const conMaterial = intervencion({
      id: "m-mat",
      fachadaId: "f",
      ejecutadoPor: "maestros_bodetek",
      cotizaciones: [],
      sinMateriales: false,
      materiales: [{ valorNeto: 10_000, valorBruto: 11_900 }],
    });
    assert.equal(esCompletaParaCostos(conMaterial), true);
  });
});

describe("varias cotizaciones cubriendo tipos distintos", () => {
  it("lista los tipos de la intervención que ninguna cotización cubre", () => {
    const i = intervencion({
      id: "i",
      fachadaId: "f",
      tipos: [
        { tipo: "pintura", dias: 3 },
        { tipo: "limpieza", dias: 1 },
        { tipo: "reparacion", dias: 2 },
      ],
      cotizaciones: [
        {
          valorNeto: 80_000,
          valorBruto: 95_200,
          cotizacionKey: "a.pdf",
          facturaKey: "fa.pdf",
          tipos: ["pintura"],
        },
        {
          valorNeto: 40_000,
          valorBruto: 47_600,
          cotizacionKey: "b.pdf",
          facturaKey: null,
          tipos: ["limpieza"],
        },
      ],
    });
    assert.deepEqual(tiposSinCotizacion(i), ["reparacion"]);
    assert.equal(esCompletaParaCostos(i), true);
    const dash = agregarIndicadores([i]);
    assert.equal(dash.costos.cotizacionesNeto, 120_000);
    assert.deepEqual(dash.costos.facturas, { m: 1, n: 2 });
  });

  it("si las cotizaciones cubren todos los tipos, no falta ninguno", () => {
    const i = intervencion({
      id: "i",
      fachadaId: "f",
      tipos: [
        { tipo: "pintura", dias: 3 },
        { tipo: "limpieza", dias: 4 },
      ],
      cotizaciones: [
        {
          valorNeto: 10_000,
          valorBruto: 11_900,
          cotizacionKey: "a.pdf",
          facturaKey: "fa.pdf",
          tipos: ["pintura", "limpieza"],
        },
      ],
    });
    assert.deepEqual(tiposSinCotizacion(i), []);
  });
});

describe("varias hojalaterías", () => {
  it("una válida alcanza para completitud; el dashboard suma todas", () => {
    const i = intervencion({
      id: "i",
      fachadaId: "f",
      requiereHojalateria: true,
      hojalaterias: [
        { proveedorId: null, valorNeto: 1_000, valorBruto: 1_190 },
        { proveedorId: "h1", valorNeto: 20_000, valorBruto: 23_800 },
        { proveedorId: "h2", valorNeto: 5_000, valorBruto: 5_950 },
      ],
    });
    assert.equal(esCompletaParaCostos(i), true);
    const dash = agregarIndicadores([i]);
    assert.equal(dash.costos.hojalateriaNeto, 26_000);
    assert.equal(dash.costos.hojalateriaBruto, 30_940);
  });
});

describe("dashboard: cobertura M de N y días/m²", () => {
  it("cada indicador muestra su propio calculado sobre M de N", () => {
    const completaAmbos = intervencion({ id: "ok", fachadaId: "f1" });
    const soloDias = intervencion({
      id: "solo-dias",
      fachadaId: "f2",
      superficieM2Snapshot: 20,
      ejecutadoPor: null,
      cotizaciones: [],
      tipos: [{ tipo: "limpieza", dias: 2 }],
    });
    const incompleta = intervencion({
      id: "incompleta",
      fachadaId: "f3",
      superficieM2Snapshot: 10,
      tipos: [],
      ejecutadoPor: null,
      cotizaciones: [],
    });

    const dash = agregarIndicadores([completaAmbos, soloDias, incompleta]);
    assert.equal(dash.intervencionesN, 3);
    assert.deepEqual(dash.dias.cobertura, { m: 2, n: 3 });
    assert.deepEqual(dash.costos.cobertura, { m: 1, n: 3 });
    assert.deepEqual(dash.costos.facturas, { m: 1, n: 1 });
    assert.equal(dash.dias.m2, 60);
    assert.equal(dash.dias.total, 7);
    assert.equal(dash.dias.porTipo.pintura, 5);
    assert.equal(dash.dias.porTipo.limpieza, 2);
    assert.equal(dash.dias.diasPorM2, 0.12);
    assert.equal(dash.costos.cotizacionesNeto, 100_000);
    assert.equal(dash.costos.totalBruto, 119_000);
  });

  it("la duración calendario es informativa y no entra en días/m²", () => {
    assert.equal(duracionCalendarioDias("2026-03-01", "2026-03-10"), 10);
    assert.equal(duracionCalendarioDias("2026-03-01", "2026-03-01"), 1);
    assert.equal(duracionCalendarioDias("2026-03-01", null), null);
    assert.equal(duracionCalendarioDias("2026-03-10", "2026-03-01"), null);

    const i = intervencion({
      id: "i",
      fachadaId: "f",
      fechaInicio: "2026-03-01",
      fechaTermino: "2026-03-10",
      superficieM2Snapshot: 10,
      tipos: [{ tipo: "pintura", dias: 2 }],
    });
    const dash = agregarIndicadores([i]);
    assert.equal(dash.dias.total, 2);
    assert.equal(dash.dias.diasPorM2, 0.2);
    assert.notEqual(dash.dias.total, duracionCalendarioDias(i.fechaInicio, i.fechaTermino));
  });

  it("Maestros no suma cotizaciones residuales al total de costos", () => {
    const i = intervencion({
      id: "i",
      fachadaId: "f",
      ejecutadoPor: "maestros_bodetek",
      sinMateriales: false,
      materiales: [{ valorNeto: 8_000, valorBruto: 9_520 }],
      cotizaciones: [
        {
          valorNeto: 100_000,
          valorBruto: 119_000,
          cotizacionKey: "legacy.pdf",
          facturaKey: "legacy-f.pdf",
          tipos: ["pintura"],
        },
      ],
    });
    assert.equal(esCompletaParaCostos(i), true);
    const dash = agregarIndicadores([i]);
    assert.equal(dash.costos.cotizacionesNeto, 0);
    assert.equal(dash.costos.materialesNeto, 8_000);
    assert.equal(dash.costos.totalNeto, 8_000);
    assert.deepEqual(dash.costos.facturas, { m: 0, n: 0 });
  });

  it("avisa al pasar a Maestros si ya hay cotizaciones; no borra", () => {
    assert.equal(
      debeAdvertirCambioEjecutor("proveedor_externo", "maestros_bodetek", 2),
      true,
    );
    assert.equal(
      debeAdvertirCambioEjecutor("proveedor_externo", "maestros_bodetek", 0),
      false,
    );
    assert.equal(
      debeAdvertirCambioEjecutor("maestros_bodetek", "maestros_bodetek", 2),
      false,
    );
  });

  it("el filtro de rubro incluye mostrar todos y el rubro materiales", () => {
    assert.equal(proveedorPasaFiltroRubro(["materiales"], FILTRO_RUBRO_TODOS), true);
    assert.equal(proveedorPasaFiltroRubro(["materiales"], "materiales"), true);
    assert.equal(proveedorPasaFiltroRubro(["pintura"], "materiales"), false);
    assert.equal(proveedorPasaFiltroRubro(["pintura"], "hojalateria"), false);
  });
});

describe("estado null ↔ vacío", () => {
  it("mapea null de la BD a \"\" para labels y filtros", () => {
    assert.equal(estadoFachadaDesdeDb(null), "");
    assert.equal(estadoFachadaDesdeDb(undefined), "");
    assert.equal(estadoFachadaDesdeDb("sin_empezar"), "sin_empezar");
    assert.equal(estadoFachadaHaciaDb(""), null);
    assert.equal(estadoFachadaHaciaDb("entregado"), "entregado");
    assert.equal(labelEstadoFachada(null), ESTADO_TRABAJO_LABEL[""]);
    assert.equal(labelEstadoFachada("en_proceso"), ESTADO_TRABAJO_LABEL.en_proceso);
  });
});
