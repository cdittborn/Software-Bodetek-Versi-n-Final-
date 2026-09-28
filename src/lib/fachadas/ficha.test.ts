import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  chipsTiposIntervencion,
  diasCalendario,
  diferenciaFacturadoMenosCotizado,
  filasHistorialFachada,
  hoyIsoChile,
  mediaPortada,
  registrosAnterioresAlSistema,
  totalHistoricoNeto,
} from "./ficha";
import type { IntervencionIndicadores } from "./indicadores";
import type { MediaFachada } from "./tipos";

function ind(
  extra: Partial<IntervencionIndicadores> = {},
): IntervencionIndicadores {
  return {
    id: "i1",
    fachadaId: "f1",
    ejecutadoPor: "maestros_bodetek",
    requiereHojalateria: false,
    sinMateriales: true,
    fechaInicio: "2026-03-01",
    fechaTermino: "2026-03-04",
    altoMSnapshot: 10,
    anchoMSnapshot: 4,
    superficieM2Snapshot: 40,
    tipos: [{ tipo: "pintura", dias: 3.5 }],
    cotizaciones: [],
    hojalaterias: [],
    materiales: [{ valorNeto: 80_000, valorBruto: 95_200, tipo: "pintura" }],
    documentos: [],
    ...extra,
  };
}

describe("ficha de fachada", () => {
  it("hoyIsoChile es YYYY-MM-DD", () => {
    assert.match(hoyIsoChile(new Date("2026-09-28T12:00:00Z")), /^\d{4}-\d{2}-\d{2}$/);
  });

  it("días de calendario son inclusivos", () => {
    assert.equal(diasCalendario("2026-03-01", "2026-03-04"), 4);
    assert.equal(diasCalendario(null, "2026-03-04"), null);
    assert.equal(diasCalendario("2026-03-04", "2026-03-01"), null);
  });

  it("chips: realizado con días; el resto tachable", () => {
    const chips = chipsTiposIntervencion([{ tipo: "pintura", dias: 3.5 }]);
    const pintura = chips.find((c) => c.tipo === "pintura");
    const limpieza = chips.find((c) => c.tipo === "limpieza");
    assert.equal(pintura?.realizado, true);
    assert.equal(pintura?.label, "Pintura · 3,5 d");
    assert.equal(limpieza?.realizado, false);
    assert.equal(limpieza?.label, "Limpieza");
  });

  it("portada: es_portada gana; si no, la primera foto con URL", () => {
    const media: MediaFachada[] = [
      {
        id: "a",
        tipo: "antes",
        tipoArchivo: "foto",
        objectKey: "a",
        nombreArchivo: "a.jpg",
        thumbnailKey: null,
        publicUrl: "https://x/a.jpg",
        thumbnailUrl: null,
        esPortada: false,
        orden: 0,
        fecha: null,
      },
      {
        id: "b",
        tipo: "antes",
        tipoArchivo: "foto",
        objectKey: "b",
        nombreArchivo: "b.jpg",
        thumbnailKey: null,
        publicUrl: "https://x/b.jpg",
        thumbnailUrl: null,
        esPortada: true,
        orden: 1,
        fecha: null,
      },
    ];
    assert.equal(mediaPortada(media, "antes")?.id, "b");
    assert.equal(mediaPortada(media, "despues"), null);
  });

  it("total histórico y diferencia facturado − cotizado son netos", () => {
    assert.equal(totalHistoricoNeto([ind(), ind({ id: "i2" })]), 160_000);
    assert.equal(
      diferenciaFacturadoMenosCotizado({
        neto: 100,
        estimado: false,
        cotizadoNeto: 120,
        facturadoNeto: 100,
      }),
      -20,
    );
  });

  it("registro anterior al sistema: una fila por fecha anotada, filtrable por tipo", () => {
    const ant = registrosAnterioresAlSistema({
      ultimaLimpiezaFecha: "2022-11-20",
      ultimaReparacionFecha: "2021-08-15",
      ultimaPinturaFecha: null,
    });
    assert.deepEqual(
      ant.map((a) => a.tipo),
      ["limpieza", "reparacion"],
    );
    assert.equal(ant[0]?.fecha, "2022-11-20");

    const ints = [
      {
        id: "i1",
        fechaInicio: "2026-09-01",
        fechaTermino: "2026-09-12",
        tipos: [
          { tipo: "limpieza" as const, dias: 2 },
          { tipo: "pintura" as const, dias: 3 },
        ],
        requiereHojalateria: true,
      },
    ];
    const todos = filasHistorialFachada(ints, ant, "todos");
    assert.equal(todos.length, 3);
    assert.equal(todos[0]?.kind, "intervencion");
    assert.equal(todos[1]?.kind, "anterior");
    if (todos[1]?.kind === "anterior") assert.equal(todos[1].tipo, "limpieza");

    const soloRep = filasHistorialFachada(ints, ant, "reparacion");
    assert.equal(soloRep.length, 1);
    assert.equal(soloRep[0]?.kind, "anterior");

    const hoja = filasHistorialFachada(ints, ant, "hojalateria");
    assert.equal(hoja.length, 1);
    assert.equal(hoja[0]?.kind, "intervencion");
  });
});
