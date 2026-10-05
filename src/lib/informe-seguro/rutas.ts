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
