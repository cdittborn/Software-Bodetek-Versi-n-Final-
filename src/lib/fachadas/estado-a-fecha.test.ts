import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estadoAFecha, estadoPlano } from "./estado-a-fecha";
import type { IntervencionIndicadores } from "./indicadores";
import { inicioTemporada } from "./temporada";
import type { FachadaListadoItem } from "./tipos";

function fachada(extra: Partial<FachadaListadoItem> = {}): FachadaListadoItem {
  return {
    id: "f1",
    nombre: "Local 1 · Fachada 1",
    letra: null,
    evaluadaEn: null,
    recintoId: null,
    recintoCodigo: null,
    recintoEtiqueta: "Local 1",
    superficieM2: null,
    frecuenciaRevisionMeses: 12,
    frecuenciaLimpiezaMeses: 6,
    frecuenciaReparacionMeses: 24,
    frecuenciaPinturaMeses: 24,
    ultimaLimpiezaFecha: null,
    ultimaReparacionFecha: null,
    ultimaPinturaFecha: null,
    fotoUrl: null,
    intervencionesN: 1,
    ultimoEstado: "terminada",
    ...extra,
  };
}

function intervencion(
  extra: Partial<IntervencionIndicadores>,
): IntervencionIndicadores {
  return {
    id: "i1",
    fachadaId: "f1",
    ejecutadoPor: "maestros_bodetek",
    requiereHojalateria: false,
    sinMateriales: true,
    fechaInicio: "2026-08-01",
    fechaTermino: "2026-08-20",
    creadoEn: "2026-08-01",
    estado: "terminada",
    altoMSnapshot: null,
    anchoMSnapshot: null,
    superficieM2Snapshot: null,
    tipos: [
      { tipo: "limpieza", dias: 1 },
      { tipo: "reparacion", dias: 1 },
      { tipo: "pintura", dias: 1 },
    ],
    cotizaciones: [],
    hojalaterias: [],
    materiales: [],
    ...extra,
  };
}

describe("estado del plano a una fecha", () => {
  it("sin evaluar si no hay evaluación ni intervenciones", () => {
    assert.equal(estadoPlano(fachada({ intervencionesN: 0 }), [], "2026-10-09"), "sin_evaluar");
  });

  it("usa el estado calculado cuando ya hay una intervención", () => {
    const estado = estadoPlano(
      fachada(),
      [intervencion({ estado: "programada", fechaInicio: "2026-11-02", fechaTermino: null, creadoEn: "2026-08-20", tipos: [] })],
      "2026-10-09",
    );
    assert.equal(estado, "programada");
  });

  it("ver como antes, al inicio de temporada, no marca al día si la única intervención terminó después", () => {
    const hoy = "2026-10-09";
    const inicio = inicioTemporada(hoy);
    const unica = intervencion({
      creadoEn: "2026-08-15",
      fechaInicio: "2026-08-01",
      fechaTermino: "2026-08-20",
      estado: "terminada",
    });
    assert.notEqual(estadoAFecha(fachada(), [unica], inicio), "al_dia");
    assert.equal(estadoAFecha(fachada(), [unica], inicio), "sin_evaluar");

    const enCurso = intervencion({
      creadoEn: "2026-06-01",
      fechaInicio: "2026-06-15",
      fechaTermino: "2026-08-20",
      estado: "terminada",
    });
    assert.equal(estadoAFecha(fachada(), [enCurso], inicio), "en_ejecucion");
  });
});
