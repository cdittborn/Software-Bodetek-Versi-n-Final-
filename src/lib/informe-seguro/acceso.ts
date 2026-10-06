/**
 * Un solo resultado para token desconocido, apagado o vencido.
 * La página pública responde 404 en todos esos casos.
 * El link muestra lo último guardado: no exige una versión congelada.
 */
export type AccesoPublico = "ok" | "oculto";

export function resolverAccesoPublico(input: {
  encontrado: boolean;
  tokenActivo: boolean;
  tokenExpira: string | null;
  hoy: string;
}): AccesoPublico {
  if (!input.encontrado || !input.tokenActivo) return "oculto";
  if (input.tokenExpira && input.tokenExpira < input.hoy) return "oculto";
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
