export function eventoInformeHref(
  categoriaId: string,
  subtipoId: string,
  eventoId: string,
) {
  return `/trabajos/c/${categoriaId}/s/${subtipoId}/e/${eventoId}/informe`;
}

export function informeSeguroPublicoHref(token: string) {
  return `/informe-seguro/${token}`;
}

/** El liquidador siempre recibe producción, nunca el preview ni localhost. */
export const ORIGEN_INFORME_LIQUIDADOR =
  "https://software-bodetek-versi-n-final.vercel.app";

export function urlInformeParaLiquidador(path: string): string {
  if (path.startsWith("https://") || path.startsWith("http://")) return path;
  const ruta = path.startsWith("/") ? path : `/${path}`;
  return `${ORIGEN_INFORME_LIQUIDADOR}${ruta}`;
}
