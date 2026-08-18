/**
 * Construye la URL pública de lectura para una key de R2.
 * Pensado para prefijos públicos (ej. trabajos/...).
 * Para protocolos/legal usar URL prefirmada de GetObject (aún no implementado).
 */
export function construirUrlPublica(key: string): string {
  const base = process.env.R2_PUBLIC_URL;
  if (!base) {
    throw new Error("Falta R2_PUBLIC_URL");
  }

  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedKey = key.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedKey}`;
}
