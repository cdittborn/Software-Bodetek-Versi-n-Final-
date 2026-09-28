import { construirUrlPublica } from "@/lib/r2/utils";
import type { TrabajoMediaItem } from "@/lib/trabajos";

/** URL pública de la miniatura, o null si no existe. */
export function thumbnailPublicUrl(
  thumbnailKey: string | null | undefined,
): string | null {
  if (!thumbnailKey) return null;
  return construirUrlPublica(thumbnailKey);
}

/** URL para la grilla: solo miniatura. Nunca el original (listados). */
export function urlGrillaMedia(item: TrabajoMediaItem): string | null {
  return item.thumbnailPublicUrl ?? null;
}
