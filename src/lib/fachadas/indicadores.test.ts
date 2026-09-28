import assert from "node:assert/strict";
import { describe, it } from "node:test";
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
  asMedidaNullable,
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
  tieneSuperficieM2,
  tiposSinCotizacion,
  filtrarIntervenciones,
  FILTRO_DASHBOARD_VACIO,
  indicadoresDeIntervencion,
  type IntervencionIndicadores,
  costoNetoIntervencion,
  costoCategoria,
  estadoCalculadoFachada,
  proximaRevision,
  superficieDashboard,
  alertasDocumentos,
  addMonthsIso,
  etiquetaCortaFachada,
  hayNombreFachadaDuplicado,
  materialesNetoPorTipo,
  proximasPorTipo,
  proximosVencimientos,
  fechaBaseTipo,
  normalizarFechaBase,
  type FachadaIndicadores,
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
    estado: "programada",
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
  it("sugiere alto × ancho redondeado a 2 decimales (solo referencia)", () => {
    assert.equal(superficieSugerida(2, 3), 6);
    assert.equal(superficieSugerida(2.5, 3.3), 8.25);
    assert.equal(superficieSugerida(null, 3), null);
    assert.equal(superficieSugerida(0, 3), null);
  });

  it("alto y ancho no rellenan la superficie", () => {
    let e = estadoMedidasVacio();
    e = aplicarCambioAlto(e, 4);
    assert.equal(e.superficieM2, null);
    e = aplicarCambioAncho(e, 10);
    assert.equal(e.superficieM2, null);
    e = aplicarCambioAlto(e, 5);
    assert.equal(e.superficieM2, null);
  });

  it("el usuario escribe m² a mano; alto y ancho no la pisan", () => {
    let e = aplicarCambioAncho(aplicarCambioAlto(estadoMedidasVacio(), 4), 10);
    e = aplicarCambioSuperficie(e, 32);
    assert.equal(e.superficieManual, true);
    assert.equal(e.superficieM2, 32);
    e = aplicarCambioAlto(e, 6);
    assert.equal(e.superficieM2, 32);
    e = aplicarCambioAncho(e, 12);
    assert.equal(e.superficieM2, 32);
  });

  it("Number(null) no se trata como 0 m²", () => {
    assert.equal(asMedidaNullable(null), null);
    assert.equal(asMedidaNullable(undefined), null);
    assert.equal(asMedidaNullable(""), null);
    assert.equal(asMedidaNullable(0), null);
    assert.equal(asMedidaNullable(-1), null);
    assert.equal(asMedidaNullable(111.6), 111.6);
    assert.equal(asMedidaNullable("8.25"), 8.25);
    assert.equal(tieneSuperficieM2(null), false);
    assert.equal(tieneSuperficieM2(0), false);
    assert.equal(tieneSuperficieM2(40), true);
  });

  it("muestra hint solo cuando alto×ancho difiere de la superficie", () => {
    assert.equal(hintSuperficie(4, 10, 40), null);
    assert.equal(hintSuperficie(4, 10, 32), "alto × ancho = 40 m²");
    assert.equal(hintSuperficie(2.5, 3.3, 8), "alto × ancho = 8.25 m²");
    assert.equal(hintSuperficie(4, null, 40), null);
  });

  it("el snapshot copia las tres medidas (o null)", () => {
    let e = aplicarCambioAncho(aplicarCambioAlto(estadoMedidasVacio(), 4), 10);
    assert.deepEqual(snapshotDesdeMedidas(e), {
      altoMSnapshot: 4,
      anchoMSnapshot: 10,
      superficieM2Snapshot: null,
    });
    e = aplicarCambioSuperficie(e, 32);
    assert.deepEqual(snapshotDesdeMedidas(e), {
      altoMSnapshot: 4,
      anchoMSnapshot: 10,
      superficieM2Snapshot: 32,
    });
    e = aplicarCambioSuperficie(e, null);
    assert.deepEqual(snapshotDesdeMedidas(e), {
      altoMSnapshot: 4,
      anchoMSnapshot: 10,
      superficieM2Snapshot: null,
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
    let fachada = aplicarCambioSuperficie(
      aplicarCambioAncho(aplicarCambioAlto(estadoMedidasVacio(), 4), 10),
      40,
    );
    const snap = copiarSnapshotAlCrear(fachada);
    fachada = aplicarCambioAlto(fachada, 8);
    assert.equal(fachada.superficieM2, 40);
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
      superficieM2Snapshot: 40,
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
  it("exige ≥1 tipo con días; el m² no es requisito", () => {
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
      true,
    );
    assert.equal(
      esCompletaParaDias(
        intervencion({
          id: "sin-snapshot",
          fachadaId: "f",
          superficieM2Snapshot: null,
        }),
      ),
      true,
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
    assert.equal(dash.costos.totalNeto, 100_000);
    assert.equal(dash.costos.totalBruto, 100_000);
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
    // Hay factura de 80.000: gana sobre las cotizaciones (120.000).
    assert.equal(dash.costos.cotizacionesNeto, 80_000);
    assert.deepEqual(dash.costos.facturas, { m: 1, n: 1 });
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
    assert.equal(dash.costos.hojalateriaBruto, 26_000);
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
    assert.equal(dash.costos.totalNeto, 100_000);
    assert.equal(dash.costos.totalBruto, 100_000);
    assert.deepEqual(dash.dias.coberturaM2, { m: 2, n: 3 });
  });

  it("sin m² entra en días y costos, no en días/m² ni m² del dashboard", () => {
    const conM2 = intervencion({
      id: "con",
      fachadaId: "f1",
      superficieM2Snapshot: 40,
      tipos: [{ tipo: "pintura", dias: 4 }],
    });
    const sinM2 = intervencion({
      id: "sin",
      fachadaId: "f2",
      superficieM2Snapshot: null,
      tipos: [{ tipo: "limpieza", dias: 2 }],
    });
    const dash = agregarIndicadores([conM2, sinM2]);
    assert.equal(dash.dias.total, 6);
    assert.equal(dash.dias.porTipo.pintura, 4);
    assert.equal(dash.dias.porTipo.limpieza, 2);
    assert.equal(dash.dias.m2, 40);
    assert.equal(dash.dias.diasPorM2, 0.1);
    assert.deepEqual(dash.dias.cobertura, { m: 2, n: 2 });
    assert.deepEqual(dash.dias.coberturaM2, { m: 1, n: 2 });
    assert.equal(dash.costos.totalNeto, 200_000);
    assert.equal(costoNetoIntervencion(sinM2).costoPorM2, null);
    assert.equal(indicadoresDeIntervencion(sinM2).m2, null);
    assert.equal(indicadoresDeIntervencion(sinM2).diasPorM2, null);
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
    assert.equal(
      debeAdvertirCambioEjecutor("maestros_bodetek", "proveedor_externo", 2),
      true,
    );
  });

  it("el filtro de rubro incluye mostrar todos y el rubro materiales", () => {
    assert.equal(proveedorPasaFiltroRubro(["materiales"], FILTRO_RUBRO_TODOS), true);
    assert.equal(proveedorPasaFiltroRubro(["materiales"], "materiales"), true);
    assert.equal(proveedorPasaFiltroRubro(["pintura"], "materiales"), false);
    assert.equal(proveedorPasaFiltroRubro(["pintura"], "hojalateria"), false);
  });
});

describe("filtros e indicadores de una intervención", () => {
  it("filtra por ejecutor, tipo, proveedor y rango de fechas", () => {
    const a = intervencion({
      id: "a",
      fachadaId: "f1",
      proveedorId: "p1",
      fechaInicio: "2026-03-01",
      tipos: [{ tipo: "pintura", dias: 2 }],
    });
    const b = intervencion({
      id: "b",
      fachadaId: "f2",
      ejecutadoPor: "maestros_bodetek",
      proveedorId: null,
      sinMateriales: true,
      cotizaciones: [],
      fechaInicio: "2026-06-01",
      tipos: [{ tipo: "limpieza", dias: 1 }],
    });
    const filtradas = filtrarIntervenciones([a, b], {
      ...FILTRO_DASHBOARD_VACIO,
      ejecutadoPor: "proveedor_externo",
      tipo: "pintura",
      proveedorId: "p1",
      fechaDesde: "2026-02-01",
      fechaHasta: "2026-04-01",
    });
    assert.deepEqual(
      filtradas.map((i) => i.id),
      ["a"],
    );
  });

  it("desglosa costo y % de una intervención; sin factura no bloquea el costo", () => {
    const i = intervencion({
      id: "i",
      fachadaId: "f",
      superficieM2Snapshot: 40,
      tipos: [{ tipo: "pintura", dias: 4 }],
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
    const ind = indicadoresDeIntervencion(i);
    assert.equal(ind.costoTotalBruto, 100_000);
    assert.equal(ind.costoPorM2, 2500);
    assert.equal(ind.diasTotal, 4);
    assert.equal(ind.diasPorM2, 0.1);
    assert.deepEqual(ind.facturas, { m: 0, n: 1 });
    assert.equal(ind.desglose[0].pct, 100);
  });
});

describe("estados de intervención (sin mapeo de filtración)", () => {
  it("mapea valores viejos al nuevo check y nunca devuelve vacío", () => {
    assert.equal(estadoFachadaDesdeDb(null), "programada");
    assert.equal(estadoFachadaDesdeDb(undefined), "programada");
    assert.equal(estadoFachadaDesdeDb(""), "programada");
    assert.equal(estadoFachadaDesdeDb("sin_empezar"), "programada");
    assert.equal(estadoFachadaDesdeDb("programada"), "programada");
    assert.equal(estadoFachadaDesdeDb("en_proceso"), "en_ejecucion");
    assert.equal(estadoFachadaDesdeDb("ejecutado_pendiente_entrega"), "en_ejecucion");
    assert.equal(estadoFachadaDesdeDb("en_ejecucion"), "en_ejecucion");
    assert.equal(estadoFachadaDesdeDb("entregado"), "terminada");
    assert.equal(estadoFachadaDesdeDb("terminada"), "terminada");
    assert.equal(estadoFachadaHaciaDb("programada"), "programada");
    assert.equal(estadoFachadaHaciaDb("en_ejecucion"), "en_ejecucion");
    assert.equal(labelEstadoFachada(null), "Programada");
    assert.equal(labelEstadoFachada("en_ejecucion"), "En ejecución");
    assert.equal(labelEstadoFachada("terminada"), "Terminada");
  });
});

describe("costo neto: factura o cotización aprobada como estimado", () => {
  it("mano de obra usa factura si existe; si no, cotización aprobada (estimado)", () => {
    const conFactura = intervencion({ id: "f", fachadaId: "x" });
    const cFact = costoNetoIntervencion(conFactura);
    assert.equal(cFact.manoDeObra.neto, 100_000);
    assert.equal(cFact.manoDeObra.estimado, false);
    assert.equal(cFact.totalNeto, 100_000);
    assert.equal(cFact.costoPorM2, 2500);

    const soloCotiz = intervencion({
      id: "c",
      fachadaId: "x",
      cotizaciones: [
        {
          valorNeto: 80_000,
          valorBruto: 95_200,
          cotizacionKey: "c.pdf",
          facturaKey: null,
          tipos: ["pintura"],
        },
      ],
    });
    const cEst = costoNetoIntervencion(soloCotiz);
    assert.equal(cEst.manoDeObra.neto, 80_000);
    assert.equal(cEst.manoDeObra.estimado, true);
    assert.equal(cEst.estimado, true);
  });

  it("hojalatería sigue la misma regla que la mano de obra", () => {
    const i = intervencion({
      id: "h",
      fachadaId: "x",
      documentos: [
        {
          tipoDocumento: "cotizacion",
          categoria: "hojalateria",
          valorNeto: 40_000,
          estado: "aprobada",
        },
      ],
      cotizaciones: [],
      ejecutadoPor: "maestros_bodetek",
      sinMateriales: true,
    });
    const c = costoCategoria(i, "hojalateria");
    assert.equal(c.neto, 40_000);
    assert.equal(c.estimado, true);

    const conFactura = intervencion({
      id: "hf",
      fachadaId: "x",
      documentos: [
        {
          tipoDocumento: "cotizacion",
          categoria: "hojalateria",
          valorNeto: 40_000,
          estado: "aprobada",
        },
        {
          tipoDocumento: "factura",
          categoria: "hojalateria",
          valorNeto: 42_000,
          estado: "pagada",
        },
      ],
      cotizaciones: [],
      ejecutadoPor: "maestros_bodetek",
      sinMateriales: true,
    });
    const cf = costoCategoria(conFactura, "hojalateria");
    assert.equal(cf.neto, 42_000);
    assert.equal(cf.estimado, false);
  });

  it("materiales = suma de filas (pintura + otros), no de documentos", () => {
    const i = intervencion({
      id: "m",
      fachadaId: "x",
      ejecutadoPor: "maestros_bodetek",
      cotizaciones: [],
      materiales: [
        { tipo: "pintura", valorNeto: 10_000, valorBruto: 11_900 },
        { tipo: "otros", valorNeto: 3_000, valorBruto: 3_570 },
      ],
    });
    assert.deepEqual(materialesNetoPorTipo(i), { pintura: 10_000, otros: 3_000 });
    const c = costoNetoIntervencion(i);
    assert.equal(c.materiales.neto, 13_000);
    assert.equal(c.manoDeObra.neto, 0);
    assert.equal(c.totalNeto, 13_000);
  });

  it("costo/m² usa el snapshot, no la medida viva", () => {
    const i = intervencion({
      id: "s",
      fachadaId: "x",
      superficieM2Snapshot: 50,
      superficieM2Actual: 200,
      cotizaciones: [
        {
          valorNeto: 100_000,
          valorBruto: 119_000,
          cotizacionKey: "c.pdf",
          facturaKey: "f.pdf",
          tipos: ["pintura"],
        },
      ],
    });
    assert.equal(costoNetoIntervencion(i).costoPorM2, 2000);
  });
});

describe("estado calculado de la fachada y próximas por tipo", () => {
  const fachada = (extra: Partial<FachadaIndicadores> = {}): FachadaIndicadores => ({
    id: "f1",
    nombre: "Bodega 01 frente",
    recintoId: "r1",
    superficieM2: 40,
    frecuenciaLimpiezaMeses: 6,
    frecuenciaReparacionMeses: 24,
    frecuenciaPinturaMeses: 24,
    ...extra,
  });

  const terminadaCompleta = (extra: Partial<IntervencionIndicadores> = {}) =>
    intervencion({
      id: "t",
      fachadaId: "f1",
      estado: "terminada",
      fechaTermino: "2026-06-01",
      tipos: [
        { tipo: "limpieza", dias: 2 },
        { tipo: "reparacion", dias: 1 },
        { tipo: "pintura", dias: 1 },
      ],
      ...extra,
    });

  it("en ejecución gana sobre programada y al día", () => {
    const ints = [
      terminadaCompleta({ id: "a", fechaTermino: "2026-01-01" }),
      intervencion({
        id: "b",
        fachadaId: "f1",
        estado: "en_ejecucion",
        fechaInicio: "2026-09-01",
      }),
    ];
    assert.equal(estadoCalculadoFachada(fachada(), ints, "2026-09-28"), "en_ejecucion");
  });

  it("programada solo si la fecha es futura", () => {
    const futura = intervencion({
      id: "p",
      fachadaId: "f1",
      estado: "programada",
      fechaInicio: "2026-10-01",
      fechaTermino: "2026-10-10",
    });
    assert.equal(
      estadoCalculadoFachada(fachada(), [futura], "2026-09-28"),
      "programada",
    );
    const pasada = intervencion({
      id: "p2",
      fachadaId: "f1",
      estado: "programada",
      fechaInicio: "2026-01-01",
      fechaTermino: "2026-01-10",
    });
    assert.equal(
      estadoCalculadoFachada(fachada(), [pasada], "2026-09-28"),
      "requiere_trabajo",
    );
  });

  it("al día solo si ningún tipo está vencido; nunca hecha es vencido", () => {
    const term = terminadaCompleta();
    const proximas = proximasPorTipo(fachada(), [term], "2026-09-28");
    assert.equal(proximas.find((p) => p.tipo === "limpieza")?.proximaFecha, "2026-12-01");
    assert.equal(proximas.find((p) => p.tipo === "reparacion")?.proximaFecha, "2028-06-01");
    assert.equal(proximas.find((p) => p.tipo === "pintura")?.proximaFecha, "2028-06-01");
    assert.equal(estadoCalculadoFachada(fachada(), [term], "2026-09-28"), "al_dia");

    const soloLimpieza = intervencion({
      id: "t",
      fachadaId: "f1",
      estado: "terminada",
      fechaTermino: "2026-06-01",
      tipos: [{ tipo: "limpieza", dias: 2 }],
    });
    assert.equal(
      estadoCalculadoFachada(fachada(), [soloLimpieza], "2026-09-28"),
      "requiere_trabajo",
    );
    assert.equal(estadoCalculadoFachada(fachada(), [term], "2026-12-02"), "requiere_trabajo");
    assert.equal(proximaRevision(fachada(), [term]), "2026-12-01");
  });

  it("nunca intervenida requiere trabajo; addMonths clampa el día", () => {
    assert.equal(estadoCalculadoFachada(fachada(), [], "2026-09-28"), "requiere_trabajo");
    const nunca = proximasPorTipo(fachada(), [], "2026-09-28");
    assert.ok(nunca.every((p) => p.estado === "vencido" && p.proximaFecha == null));
    assert.equal(addMonthsIso("2026-01-31", 1), "2026-02-28");
    assert.equal(etiquetaCortaFachada("B14", "A"), "B14·A");
    assert.equal(etiquetaCortaFachada("B14", null), "B14");
  });

  it("vence pronto ≤ 60 días entra al panel de vencimientos", () => {
    const term = terminadaCompleta({ fechaTermino: "2026-04-15" });
    // limpieza + 6 meses = 2026-10-15 → 17 días desde 2026-09-28
    const panel = proximosVencimientos([fachada()], [term], "2026-09-28");
    const lim = panel.find((v) => v.tipo === "limpieza");
    assert.equal(lim?.estado, "vence_pronto");
    assert.equal(lim?.proximaFecha, "2026-10-15");
    assert.ok(!panel.some((v) => v.tipo === "reparacion"));
  });

  it("nombres de fachada son únicos sin importar mayúsculas", () => {
    assert.equal(
      hayNombreFachadaDuplicado("Bodega 14 frente", [
        { id: "a", nombre: "Bodega 14 Frente" },
      ]),
      true,
    );
    assert.equal(
      hayNombreFachadaDuplicado("Bodega 14 frente", [
        { id: "a", nombre: "Bodega 14 Frente" },
      ], "a"),
      false,
    );
  });

  it("sin base (ni anotada ni TERMINADA) queda vencido", () => {
    const nunca = proximasPorTipo(fachada(), [], "2026-09-28");
    assert.ok(nunca.every((p) => p.estado === "vencido" && p.proximaFecha == null));
  });

  it("base anotada sola programa la próxima; sin TERMINADA no cambia costos ni m²", () => {
    const f = fachada({
      ultimaLimpiezaFecha: "2026-06-01",
      ultimaReparacionFecha: "2026-06-01",
      ultimaPinturaFecha: "2026-06-01",
    });
    const proximas = proximasPorTipo(f, [], "2026-09-28");
    assert.equal(proximas.find((p) => p.tipo === "limpieza")?.ultimaFecha, "2026-06-01");
    assert.equal(proximas.find((p) => p.tipo === "limpieza")?.proximaFecha, "2026-12-01");
    assert.equal(proximas.find((p) => p.tipo === "reparacion")?.proximaFecha, "2028-06-01");
    assert.equal(proximas.find((p) => p.tipo === "pintura")?.proximaFecha, "2028-06-01");
    assert.equal(estadoCalculadoFachada(f, [], "2026-09-28"), "al_dia");

    const dash = agregarIndicadores([]);
    assert.equal(dash.intervencionesN, 0);
    assert.equal(dash.costos.totalNeto, 0);
    assert.equal(dash.dias.m2, 0);
    const s = superficieDashboard([f], [], FILTRO_DASHBOARD_VACIO);
    assert.equal(s.fachadasIntervenidasN, 0);
    assert.equal(s.m2Intervenidos, 0);
    assert.equal(s.m2Totales, 40);
  });

  it("base = la más reciente entre fecha anotada y última TERMINADA del tipo", () => {
    const term = terminadaCompleta();
    const anotadaMasNueva = fachada({ ultimaLimpiezaFecha: "2026-08-01" });
    const limNueva = proximasPorTipo(anotadaMasNueva, [term], "2026-09-28").find(
      (p) => p.tipo === "limpieza",
    );
    assert.equal(fechaBaseTipo(anotadaMasNueva, [term], "limpieza"), "2026-08-01");
    assert.equal(limNueva?.ultimaFecha, "2026-08-01");
    assert.equal(limNueva?.proximaFecha, "2027-02-01");
    assert.equal(
      proximasPorTipo(anotadaMasNueva, [term], "2026-09-28").find((p) => p.tipo === "reparacion")
        ?.ultimaFecha,
      "2026-06-01",
    );

    const anotadaMasVieja = fachada({ ultimaLimpiezaFecha: "2024-01-15" });
    const limVieja = proximasPorTipo(anotadaMasVieja, [term], "2026-09-28").find(
      (p) => p.tipo === "limpieza",
    );
    assert.equal(limVieja?.ultimaFecha, "2026-06-01");
    assert.equal(limVieja?.proximaFecha, "2026-12-01");
    assert.equal(estadoCalculadoFachada(anotadaMasVieja, [term], "2026-09-28"), "al_dia");
  });

  it("normalizarFechaBase: vacío null; futura e inválida fallan", () => {
    assert.equal(normalizarFechaBase("", "2026-09-28"), null);
    assert.equal(normalizarFechaBase("   ", "2026-09-28"), null);
    assert.equal(normalizarFechaBase("2026-09-28", "2026-09-28"), "2026-09-28");
    assert.throws(() => normalizarFechaBase("2026-09-29", "2026-09-28"), /futura/);
    assert.throws(() => normalizarFechaBase("31-09-2026", "2026-09-28"), /válida/);
    assert.throws(() => normalizarFechaBase("2026-02-31", "2026-09-28"), /válida/);
  });
});

describe("superficie del dashboard (totales, intervenidos, restantes)", () => {
  it("m² intervenidos son las fachadas distintas con intervención terminada en el filtro", () => {
    const fachadas: FachadaIndicadores[] = [
      { id: "f1", recintoId: "r1", superficieM2: 40, frecuenciaLimpiezaMeses: 6, frecuenciaReparacionMeses: 24, frecuenciaPinturaMeses: 24 },
      { id: "f2", recintoId: "r1", superficieM2: 60, frecuenciaLimpiezaMeses: 6, frecuenciaReparacionMeses: 24, frecuenciaPinturaMeses: 24 },
      { id: "f3", recintoId: "r2", superficieM2: 10, frecuenciaLimpiezaMeses: 6, frecuenciaReparacionMeses: 24, frecuenciaPinturaMeses: 24 },
    ];
    const ints = [
      intervencion({
        id: "i1",
        fachadaId: "f1",
        recintoId: "r1",
        estado: "terminada",
        fechaTermino: "2026-03-10",
      }),
      intervencion({
        id: "i2",
        fachadaId: "f1",
        recintoId: "r1",
        estado: "terminada",
        fechaTermino: "2026-04-01",
      }),
      intervencion({
        id: "i3",
        fachadaId: "f2",
        recintoId: "r1",
        estado: "en_ejecucion",
        fechaInicio: "2026-03-01",
      }),
    ];
    const s = superficieDashboard(fachadas, ints, {
      ...FILTRO_DASHBOARD_VACIO,
      fechaDesde: "2026-01-01",
      fechaHasta: "2026-12-31",
    });
    assert.equal(s.m2Totales, 110);
    assert.equal(s.m2Intervenidos, 40);
    assert.equal(s.m2Restantes, 70);
    assert.equal(s.fachadasIntervenidasN, 1);
    assert.equal(s.fachadasN, 3);
    assert.deepEqual(s.cobertura, { m: 3, n: 3 });
  });

  it("fachadas sin m² se excluyen de totales/intervenidos/restantes", () => {
    const fachadas: FachadaIndicadores[] = [
      { id: "f1", recintoId: "r1", superficieM2: 40, frecuenciaLimpiezaMeses: 6, frecuenciaReparacionMeses: 24, frecuenciaPinturaMeses: 24 },
      { id: "f2", recintoId: "r1", superficieM2: null, frecuenciaLimpiezaMeses: 6, frecuenciaReparacionMeses: 24, frecuenciaPinturaMeses: 24 },
      { id: "f3", recintoId: "r2", superficieM2: 10, frecuenciaLimpiezaMeses: 6, frecuenciaReparacionMeses: 24, frecuenciaPinturaMeses: 24 },
    ];
    const ints = [
      intervencion({
        id: "i1",
        fachadaId: "f1",
        recintoId: "r1",
        estado: "terminada",
        fechaTermino: "2026-03-10",
      }),
      intervencion({
        id: "i2",
        fachadaId: "f2",
        recintoId: "r1",
        estado: "terminada",
        fechaTermino: "2026-03-10",
        superficieM2Snapshot: null,
      }),
    ];
    const s = superficieDashboard(fachadas, ints, FILTRO_DASHBOARD_VACIO);
    assert.equal(s.m2Totales, 50);
    assert.equal(s.m2Intervenidos, 40);
    assert.equal(s.m2Restantes, 10);
    assert.equal(s.fachadasIntervenidasN, 2);
    assert.equal(s.fachadasN, 3);
    assert.deepEqual(s.cobertura, { m: 2, n: 3 });
  });
});

describe("alertas de cotizado vs facturado", () => {
  it("detecta cotización aprobada sin factura y diferencias de neto", () => {
    const sinFactura = intervencion({
      id: "a",
      fachadaId: "f",
      cotizaciones: [
        {
          valorNeto: 50_000,
          valorBruto: 59_500,
          cotizacionKey: "c.pdf",
          facturaKey: null,
          tipos: ["pintura"],
        },
      ],
    });
    const distinta = intervencion({
      id: "b",
      fachadaId: "f",
      documentos: [
        {
          tipoDocumento: "cotizacion",
          categoria: "mano_de_obra",
          valorNeto: 100_000,
          estado: "aprobada",
        },
        {
          tipoDocumento: "factura",
          categoria: "mano_de_obra",
          valorNeto: 80_000,
          estado: "pagada",
        },
      ],
    });
    const a = alertasDocumentos([sinFactura, distinta]);
    assert.equal(a.cotizacionesAprobadasSinFactura.length, 1);
    assert.equal(a.cotizacionesAprobadasSinFactura[0]?.intervencionId, "a");
    assert.equal(a.diferenciasCotizadoFacturado.length, 1);
    assert.equal(a.diferenciasCotizadoFacturado[0]?.diferenciaNeto, -20_000);
  });
});

