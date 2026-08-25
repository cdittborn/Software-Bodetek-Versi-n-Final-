import { idDescripcionProblema, idPlanProblema, TIPOS_PROBLEMA } from "@/lib/filtracion/problemas";

export const SECCION_POR_ITEM_COMPLETITUD: Record<string, string> = {
  recinto: "sec-01",
  fecha_entrega: "sec-01",
  tipos_problema: "sec-02",
  plano_agua: "sec-04",
  plano_reparacion: "sec-04",
  ejecutado_por: "sec-05",
  proveedor: "sec-05",
  horas_maestros: "sec-05",
  cotizacion: "sec-06",
};

for (const tipo of TIPOS_PROBLEMA) {
  SECCION_POR_ITEM_COMPLETITUD[idDescripcionProblema(tipo)] = "sec-02";
  SECCION_POR_ITEM_COMPLETITUD[idPlanProblema(tipo)] = "sec-02";
}

export function seccionParaItemCompletitud(itemId: string): string | null {
  return SECCION_POR_ITEM_COMPLETITUD[itemId] ?? null;
}
