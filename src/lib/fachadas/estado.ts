export const ESTADOS_INTERVENCION_FACHADA = [
  "programada",
  "en_ejecucion",
  "terminada",
] as const;

export type EstadoIntervencionFachada =
  (typeof ESTADOS_INTERVENCION_FACHADA)[number];

export const ESTADO_INTERVENCION_FACHADA_LABEL: Record<
  EstadoIntervencionFachada,
  string
> = {
  programada: "Programada",
  en_ejecucion: "En ejecución",
  terminada: "Terminada",
};

export const ESTADOS_CALCULADOS_FACHADA = [
  "en_ejecucion",
  "programada",
  "al_dia",
  "requiere_trabajo",
] as const;

export type EstadoCalculadoFachada =
  (typeof ESTADOS_CALCULADOS_FACHADA)[number];

export const ESTADO_CALCULADO_FACHADA_LABEL: Record<
  EstadoCalculadoFachada,
  string
> = {
  en_ejecucion: "En ejecución",
  programada: "Programada",
  al_dia: "Al día",
  requiere_trabajo: "Requiere trabajo",
};

export const FRECUENCIAS_REVISION_MESES = [6, 12, 24] as const;

export type FrecuenciaRevisionMeses =
  (typeof FRECUENCIAS_REVISION_MESES)[number];

/** Estado de la intervención (ya no usa filtración ni null ↔ ""). */
export type EstadoFachada = EstadoIntervencionFachada;

export function estadoIntervencionDesdeDb(
  value: string | null | undefined,
): EstadoIntervencionFachada {
  if (value === "en_ejecucion" || value === "en_proceso") return "en_ejecucion";
  if (value === "ejecutado_pendiente_entrega") return "en_ejecucion";
  if (value === "terminada" || value === "entregado") return "terminada";
  return "programada";
}

export function estadoIntervencionHaciaDb(
  value: EstadoIntervencionFachada | null | undefined,
): EstadoIntervencionFachada {
  if (
    value === "en_ejecucion" ||
    value === "terminada" ||
    value === "programada"
  ) {
    return value;
  }
  return estadoIntervencionDesdeDb(value);
}

export function estadoFachadaDesdeDb(
  value: string | null | undefined,
): EstadoFachada {
  return estadoIntervencionDesdeDb(value);
}

export function estadoFachadaHaciaDb(
  value: EstadoFachada | null | undefined,
): string {
  return estadoIntervencionHaciaDb(value);
}

export function labelEstadoIntervencion(
  value: string | null | undefined,
): string {
  return ESTADO_INTERVENCION_FACHADA_LABEL[estadoIntervencionDesdeDb(value)];
}

export function labelEstadoFachada(
  value: EstadoFachada | string | null | undefined,
): string {
  return labelEstadoIntervencion(value);
}

export function labelEstadoCalculadoFachada(
  value: EstadoCalculadoFachada,
): string {
  return ESTADO_CALCULADO_FACHADA_LABEL[value];
}
