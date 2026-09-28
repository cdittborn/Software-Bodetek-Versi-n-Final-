/** Parseo y formato chileno para el módulo Fachadas (coma decimal, puntos de miles). */

export function parseDecimalCl(value: string): number | null {
  const t = value.trim();
  if (!t) return null;
  const normalized = t.includes(",")
    ? t.replace(/\./g, "").replace(",", ".")
    : t.replace(/\s/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function formatDecimalCl(
  n: number,
  maxFractionDigits = 2,
  minFractionDigits = 0,
): string {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  }).format(n);
}

/** Alto / ancho en metros: siempre 2 decimales (6,20 / 18,00). */
export function formatMetrosCl(n: number): string {
  return formatDecimalCl(n, 2, 2);
}

/** Superficies totales del dashboard/reporte: sin decimales (2.860). */
export function formatSuperficieEnteraCl(n: number): string {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function parseMontoNetoCl(value: string): number {
  const t = value.trim().replace(/\./g, "").replace(",", ".");
  if (!t) return 0;
  const n = Number(t);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

export function formatMontoNetoInput(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "";
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(n);
}
