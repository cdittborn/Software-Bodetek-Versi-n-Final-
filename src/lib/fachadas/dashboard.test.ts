import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  conteosEstado,
  filasTablaFachadas,
  quienEjecuto,
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

  it("filas de tabla: etiqueta recinto·letra y conteo de documentos", () => {
    const filas = filasTablaFachadas(
      [fachada({ id: "f1", letra: "A", recintoCodigo: "B14" })],
      [int({ id: "i1", fachadaId: "f1" })],
      "2026-09-01",
    );
    assert.equal(filas[0]?.etiqueta, "B14·A");
    assert.match(filas[0]?.docsLabel ?? "", /factura/);
    assert.ok(filas[0]?.tipos.includes("limpieza"));
  });
});
