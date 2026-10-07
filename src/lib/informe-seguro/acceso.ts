/**
 * Un solo resultado para token desconocido o apagado.
 * La página pública responde 404 en esos casos. El link no vence.
 * Muestra lo último guardado: no exige una versión congelada.
 */
export type AccesoPublico = "ok" | "oculto";

export function resolverAccesoPublico(input: {
  encontrado: boolean;
  tokenActivo: boolean;
}): AccesoPublico {
  if (!input.encontrado || !input.tokenActivo) return "oculto";
  return "ok";
}

/** Devuelve solo la versión publicada de mayor número. El borrador no entra aquí. */
export function contenidoPublico<T>(
  versiones: { numero: number; contenido: T }[],
  acceso: AccesoPublico,
): T | null {
  if (acceso !== "ok" || versiones.length === 0) return null;
  return versiones.reduce((a, b) => (b.numero > a.numero ? b : a)).contenido;
}
