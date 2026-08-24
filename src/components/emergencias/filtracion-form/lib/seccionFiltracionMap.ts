export const SECCION_POR_ITEM_COMPLETITUD: Record<string, string> = {
  recinto: "sec-01",
  fecha_entrega: "sec-01",
  descripcion: "sec-02",
  plan_accion: "sec-02",
  plano_agua: "sec-04",
  plano_reparacion: "sec-04",
  ejecutado_por: "sec-05",
  proveedor: "sec-05",
  horas_maestros: "sec-05",
  cotizacion: "sec-06",
};

export function seccionParaItemCompletitud(itemId: string): string | null {
  return SECCION_POR_ITEM_COMPLETITUD[itemId] ?? null;
}
