import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  agruparFachadasPorUnidad,
  conteosEstado,
  filasTablaFachadas,
  quienEjecuto,
  textoEncabezadoFachadas,
  trabajosRealizados,
} from "./dashboard";
import type { IntervencionIndicadores } from "./indicadores";
import type { FachadaListadoItem } from "./tipos";

function fachada(
  extra: Partial<FachadaListadoItem> & Pick<FachadaListadoItem, "id">,
): FachadaListadoItem {
  return {
    nombre: extra.nombre ?? extra.id,
    letra: extra.letra ?? "A",
    recintoId: extra.recintoId ?? "r1",
    recintoCodigo: extra.recintoCodigo ?? "B01",
    recintoEtiqueta: extra.recintoEtiqueta ?? "Bodega 01",
    superficieM2: extra.superficieM2 ?? 100,
    frecuenciaRevisionMeses: extra.frecuenciaRevisionMeses ?? 12,
    frecuenciaLimpiezaMeses: extra.frecuenciaLimpiezaMeses ?? 6,
    frecuenciaReparacionMeses: extra.frecuenciaReparacionMeses ?? 24,
    frecuenciaPinturaMeses: extra.frecuenciaPinturaMeses ?? 24,
    ultimaLimpiezaFecha: extra.ultimaLimpiezaFecha ?? null,
    ultimaReparacionFecha: extra.ultimaReparacionFecha ?? null,
    ultimaPinturaFecha: extra.ultimaPinturaFecha ?? null,
    fotoUrl: null,
    intervencionesN: extra.intervencionesN ?? 1,
    ultimoEstado: extra.ultimoEstado ?? "terminada",
    ...extra,
  };
}

function int(
  extra: Partial<IntervencionIndicadores> &
    Pick<IntervencionIndicadores, "id" | "fachadaId">,
): IntervencionIndicadores {
  return {
    recintoId: "r1",
    ejecutadoPor: "maestros_bodetek",
    requiereHojalateria: false,
    sinMateriales: false,
    fechaInicio: "2026-03-01",
    fechaTermino: "2026-03-10",
    estado: "terminada",
    altoMSnapshot: 4,
    anchoMSnapshot: 10,
    superficieM2Snapshot: 40,
    tipos: [{ tipo: "limpieza", dias: 2 }],
    cotizaciones: [],
    hojalaterias: [],
    materiales: [{ valorNeto: 10_000, valorBruto: 10_000, tipo: "otros" }],
    documentos: [
      {
        tipoDocumento: "factura",
        categoria: "mano_de_obra",
        valorNeto: 90_000,
        estado: "pagada",
      },
    ],
    ...extra,
  };
}

describe("dashboard Fachadas (captura 1)", () => {
  it("cuenta estados calculados: al día + en ejecución = intervenidas", () => {
    const fachadas = [
      fachada({ id: "f1", letra: "A" }),
      fachada({ id: "f2", letra: "B" }),
      fachada({ id: "f3", letra: "A", recintoCodigo: "B02" }),
    ];
    const ints = [
      int({
        id: "i1",
        fachadaId: "f1",
        estado: "terminada",
        fechaTermino: "2026-08-01",
        tipos: [
          { tipo: "limpieza", dias: 2 },
          { tipo: "reparacion", dias: 1 },
          { tipo: "pintura", dias: 1 },
        ],
      }),
      int({
        id: "i2",
        fachadaId: "f2",
        estado: "en_ejecucion",
        fechaTermino: null,
      }),
    ];
    const c = conteosEstado(fachadas, ints, "2026-09-01");
    assert.equal(c.total, 3);
    assert.equal(c.en_ejecucion, 1);
    assert.equal(c.al_dia, 1);
    assert.equal(c.requiere_trabajo, 1);
    assert.equal(c.intervenidas, 2);
    assert.equal(c.pendientes, 1);
  });

  it("reparte el neto de mano de obra+materiales por días; hojalatería aparte", () => {
    const ints = [
      int({
        id: "i1",
        fachadaId: "f1",
        tipos: [
          { tipo: "limpieza", dias: 1 },
          { tipo: "pintura", dias: 3 },
        ],
        requiereHojalateria: true,
        documentos: [
          {
            tipoDocumento: "factura",
            categoria: "mano_de_obra",
            valorNeto: 100_000,
            estado: "pagada",
          },
          {
            tipoDocumento: "factura",
            categoria: "hojalateria",
            valorNeto: 40_000,
            estado: "pagada",
          },
        ],
        materiales: [{ valorNeto: 20_000, valorBruto: 20_000, tipo: "pintura" }],
      }),
    ];
    const t = trabajosRealizados(ints);
    const lim = t.find((x) => x.key === "limpieza");
    const pin = t.find((x) => x.key === "pintura");
    const hoja = t.find((x) => x.key === "hojalateria");
    assert.equal(lim?.fachadasN, 1);
    assert.equal(lim?.dias, 1);
    assert.equal(pin?.dias, 3);
    assert.equal((lim?.neto ?? 0) + (pin?.neto ?? 0), 120_000);
    assert.equal(hoja?.neto, 40_000);
  });

  it("quién ejecutó: fachadas y % de neto", () => {
    const q = quienEjecuto([
      int({ id: "a", fachadaId: "f1", ejecutadoPor: "maestros_bodetek" }),
      int({
        id: "b",
        fachadaId: "f2",
        ejecutadoPor: "proveedor_externo",
        documentos: [
          {
            tipoDocumento: "factura",
            categoria: "mano_de_obra",
            valorNeto: 30_000,
            estado: "pagada",
          },
        ],
        materiales: [],
      }),
    ]);
    assert.equal(q.maestrosFachadas, 1);
    assert.equal(q.externosFachadas, 1);
    assert.equal(q.intervenidas, 2);
    assert.ok(q.pctMaestrosNeto != null);
  });

  it("filas de tabla: etiqueta con el nombre libre y conteo de documentos", () => {
    const filas = filasTablaFachadas(
      [fachada({ id: "f1", nombre: "Bodega 14 frente", letra: "A", recintoCodigo: "B14" })],
      [int({ id: "i1", fachadaId: "f1" })],
      "2026-09-01",
    );
    assert.equal(filas[0]?.etiqueta, "Bodega 14 frente");
    assert.match(filas[0]?.docsLabel ?? "", /factura/);
    assert.ok(filas[0]?.tipos.includes("limpieza"));
  });

  it("fila sin m² no pone 0", () => {
    const filas = filasTablaFachadas(
      [fachada({ id: "f1", nombre: "Bodega 17", superficieM2: null })],
      [],
      "2026-09-01",
    );
    assert.equal(filas[0]?.m2, null);
  });

  it("los tabs de ejecutor cambian conteos, trabajos y quién ejecutó", () => {
    const fachadas = [
      fachada({ id: "f1", nombre: "Local 1" }),
      fachada({ id: "f2", nombre: "Local 2" }),
    ];
    const ints = [
      int({
        id: "a",
        fachadaId: "f1",
        ejecutadoPor: "maestros_bodetek",
        estado: "en_ejecucion",
        fechaTermino: null,
      }),
      int({
        id: "b",
        fachadaId: "f2",
        ejecutadoPor: "proveedor_externo",
        estado: "terminada",
        fechaTermino: "2026-08-01",
        tipos: [
          { tipo: "limpieza", dias: 1 },
          { tipo: "reparacion", dias: 1 },
          { tipo: "pintura", dias: 1 },
        ],
      }),
    ];
    const maestros = ints.filter((item) => item.ejecutadoPor === "maestros_bodetek");
    const externos = ints.filter((item) => item.ejecutadoPor === "proveedor_externo");
    const conteoMaestros = conteosEstado(fachadas, maestros, "2026-09-01");
    const conteoExternos = conteosEstado(fachadas, externos, "2026-09-01");
    assert.equal(conteoMaestros.en_ejecucion, 1);
    assert.equal(conteoExternos.en_ejecucion, 0);
    assert.equal(conteoExternos.al_dia, 1);
    assert.notEqual(
      trabajosRealizados(maestros).find((item) => item.key === "limpieza")?.neto,
      trabajosRealizados(externos).find((item) => item.key === "limpieza")?.neto,
    );
    assert.equal(quienEjecuto(maestros).externosFachadas, 0);
    assert.equal(quienEjecuto(externos).maestrosFachadas, 0);
    assert.equal(quienEjecuto(maestros).maestrosFachadas, 1);
  });

  it("agrupa por unidad y ordena por unidad_label y orden", () => {
    const grupos = agruparFachadasPorUnidad(
      [
        fachada({
          id: "b",
          nombre: "Local 2 · Fachada 2",
          unidadLabel: "Local 2",
          orden: 2,
          svgId: "s1-local-2-f2",
          ubicacion: "interior",
          superficieM2: null,
          evaluadaEn: null,
          intervencionesN: 0,
        }),
        fachada({
          id: "a",
          nombre: "Local 2 · Fachada 1",
          unidadLabel: "Local 2",
          orden: 1,
          svgId: "s1-local-2-f1",
          ubicacion: "exterior",
          superficieM2: null,
          evaluadaEn: null,
          intervencionesN: 0,
        }),
        fachada({
          id: "c",
          nombre: "Bodega 1A · Fachada 1",
          unidadLabel: "Bodega 1A",
          orden: 1,
          svgId: "s2-bodega-1a-f1",
          ubicacion: "exterior",
          evaluadaEn: null,
          intervencionesN: 0,
        }),
      ],
      [],
      { hoy: "2026-10-09", haciaPorSvgId: { "s1-local-2-f1": "andenes" } },
    );
    assert.deepEqual(
      grupos.map((grupo) => grupo.unidadLabel),
      ["Bodega 1A", "Local 2"],
    );
    assert.deepEqual(
      grupos[1]?.filas.map((fila) => fila.id),
      ["a", "b"],
    );
    assert.equal(grupos[1]?.sitio, "Sitio 1");
    assert.equal(grupos[1]?.filas[0]?.hacia, "andenes");
    assert.equal(grupos[1]?.filas[0]?.m2, null);
    assert.equal(grupos[0]?.filas[0]?.estado, "sin_evaluar");
  });

  it("el encabezado cuenta fachadas, sitios y ubicación", () => {
    const texto = textoEncabezadoFachadas([
      { svgId: "s1-local-1-f1", ubicacion: "interior" },
      { svgId: "s1-local-1-f2", ubicacion: "exterior" },
      { svgId: "s2-bodega-1-f1", ubicacion: "exterior" },
    ]);
    assert.equal(texto, "3 fachadas en 2 sitios (2 exteriores, 1 interiores)");
  });
});
