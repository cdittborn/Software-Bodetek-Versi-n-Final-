/** Fecha de calendario en Chile (YYYY-MM-DD). No usar la fecha UTC del servidor. */

export function hoyIsoChile(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
