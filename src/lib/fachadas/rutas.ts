import { subtipoHref } from "@/lib/trabajos";

export function fachadaHref(
  categoriaId: string,
  subtipoId: string,
  fachadaId: string,
): string {
  return `${subtipoHref(categoriaId, subtipoId)}/f/${fachadaId}`;
}

export function intervencionHref(
  categoriaId: string,
  subtipoId: string,
  fachadaId: string,
  intervencionId: string,
): string {
  return `${fachadaHref(categoriaId, subtipoId, fachadaId)}/i/${intervencionId}`;
}
