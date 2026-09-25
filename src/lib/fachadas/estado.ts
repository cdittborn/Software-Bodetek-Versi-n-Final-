import {
  ESTADO_TRABAJO_LABEL,
  ESTADOS_LLUVIAS,
  type EstadoLluvias,
} from "@/lib/trabajos";

/** Vacío en formularios/filtros; `null` en la fila de `fachada_intervenciones`. */
export type EstadoFachada = EstadoLluvias | "";

export function estadoFachadaDesdeDb(
  value: string | null | undefined,
): EstadoFachada {
  if (value == null || value === "") return "";
  if ((ESTADOS_LLUVIAS as readonly string[]).includes(value)) {
    return value as EstadoLluvias;
  }
  return "";
}

export function estadoFachadaHaciaDb(
  value: EstadoFachada | null | undefined,
): string | null {
  if (value == null || value === "") return null;
  return value;
}

export function labelEstadoFachada(
  value: EstadoFachada | string | null | undefined,
): string {
  const estado = estadoFachadaDesdeDb(value ?? null);
  return ESTADO_TRABAJO_LABEL[estado] ?? "—";
}
