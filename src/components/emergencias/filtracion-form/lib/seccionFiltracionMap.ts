import {
  idCotizacionProblema,
  idDescripcionProblema,
  idEjecutadoPorProblema,
  idFechaEstimadaProblema,
  idHorasProblema,
  idPlanProblema,
  idProveedorProblema,
  TIPOS_PROBLEMA,
} from "@/lib/filtracion/problemas";

export const SECCION_POR_ITEM_COMPLETITUD: Record<string, string> = {
  recinto: "sec-01",
  fecha_entrega: "sec-01",
  tipos_problema: "sec-02",
  plano_agua: "sec-04",
  plano_reparacion: "sec-04",
};

for (const tipo of TIPOS_PROBLEMA) {
  SECCION_POR_ITEM_COMPLETITUD[idDescripcionProblema(tipo)] = "sec-02";
  SECCION_POR_ITEM_COMPLETITUD[idPlanProblema(tipo)] = "sec-02";
  SECCION_POR_ITEM_COMPLETITUD[idEjecutadoPorProblema(tipo)] = "sec-02";
  SECCION_POR_ITEM_COMPLETITUD[idFechaEstimadaProblema(tipo)] = "sec-02";
  SECCION_POR_ITEM_COMPLETITUD[idProveedorProblema(tipo)] = "sec-02";
  SECCION_POR_ITEM_COMPLETITUD[idHorasProblema(tipo)] = "sec-02";
  SECCION_POR_ITEM_COMPLETITUD[idCotizacionProblema(tipo)] = "sec-02";
}

export function seccionParaItemCompletitud(itemId: string): string | null {
  return SECCION_POR_ITEM_COMPLETITUD[itemId] ?? null;
}
