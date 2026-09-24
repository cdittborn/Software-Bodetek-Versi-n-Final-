import { construirUrlPublica } from "@/lib/r2/utils";

export function urlPublicaONull(key: string | null | undefined): string | null {
  if (!key) return null;
  try {
    return construirUrlPublica(key);
  } catch {
    return null;
  }
}

export function esPdf(nombre: string | null | undefined, key: string | null | undefined): boolean {
  const n = (nombre ?? key ?? "").toLowerCase();
  return n.endsWith(".pdf");
}

export function esImagen(nombre: string | null | undefined, key: string | null | undefined): boolean {
  const n = (nombre ?? key ?? "").toLowerCase();
  return /\.(png|jpe?g|webp|gif|bmp)$/.test(n);
}
