/** Fecha de calendario en Chile (YYYY-MM-DD). No usar la fecha UTC del servidor. */

export function hoyIsoChile(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Hora de reloj en Chile, 00–23, sin segundos. */
export function horaMinutoChile(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = parts.find((parte) => parte.type === "hour")?.value ?? "00";
  const minute = parts.find((parte) => parte.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}
