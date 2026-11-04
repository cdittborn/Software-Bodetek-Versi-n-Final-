import { CLAVE_CATEGORIA, CLAVE_SUBTIPO } from "@/lib/trabajos";

type ErrorConsulta = { code?: string; message?: string } | null;

/** La consulta pidió una columna de la fase 2 y la base todavía no la tiene. */
export function faltaColumnaNueva(error: ErrorConsulta): boolean {
  if (!error) return false;
  const mensaje = error.message ?? "";
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    /column .+ does not exist/i.test(mensaje) ||
    /schema cache/i.test(mensaje)
  );
}

/** Mientras `clave` no existe, las pantallas se reconocen por el nombre de hoy. */
export function claveLegacySubtipo(nombre: string): string | null {
  if (nombre === "Lluvias y temporales" || nombre === "Emergencias") {
    return CLAVE_SUBTIPO.lluviasTemporales;
  }
  if (nombre === "Clientes con patentes en proceso") return CLAVE_SUBTIPO.clientesPatentes;
  if (nombre === "Proyecto recepción de obras") return CLAVE_SUBTIPO.recepcionObras;
  if (nombre === "Revisiones y mantenciones periódicas") return CLAVE_SUBTIPO.revisionesMantenciones;
  if (nombre === "Fachadas") return CLAVE_SUBTIPO.fachadas;
  return null;
}

export function claveLegacyCategoria(nombre: string): string | null {
  if (nombre === "Otros trabajos CD") return CLAVE_CATEGORIA.otrosTrabajosCD;
  return null;
}

/**
 * El orden que el menú usa hoy, antes de la columna `orden`:
 * Techumbres primero, el resto por nombre, "Otros" y "Otros trabajos CD" al final.
 */
export function ordenMenuLegacy<T extends { nombre: string }>(filas: T[]): T[] {
  const grupo = (nombre: string) =>
    nombre === "Techumbres y canales" ? 0 : nombre === "Otros" || nombre === "Otros trabajos CD" ? 2 : 1;
  return filas.slice().sort((a, b) => {
    const d = grupo(a.nombre) - grupo(b.nombre);
    return d !== 0 ? d : a.nombre.localeCompare(b.nombre, "es");
  });
}
