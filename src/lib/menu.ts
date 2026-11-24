import { subtipoHref } from "@/lib/trabajos";

export type ColorCategoria = { color: string; tinte: string };

export const PALETA_CATEGORIAS: readonly ColorCategoria[] = [
  { color: "#5E87D6", tinte: "#C9D8F2" },
  { color: "#9682CF", tinte: "#DDD6F0" },
  { color: "#4E9E92", tinte: "#C6E2DE" },
  { color: "#C9973F", tinte: "#EDDDBF" },
  { color: "#C7707D", tinte: "#EFD0D5" },
  { color: "#8A90A0", tinte: "#DADDE4" },
  { color: "#5E9E70", tinte: "#CBE3D2" },
];

export function colorPorPosicion(indice: number): ColorCategoria {
  const n = PALETA_CATEGORIAS.length;
  return PALETA_CATEGORIAS[((indice % n) + n) % n]!;
}

/** Color guardado de la categoría; si no tiene (o no es de la paleta), el de su posición. */
export function colorCategoria(color: string | null | undefined, indice: number): ColorCategoria {
  return PALETA_CATEGORIAS.find((p) => p.color === color) ?? colorPorPosicion(indice);
}

export function tinteDeColor(color: string): string {
  return PALETA_CATEGORIAS.find((p) => p.color === color)?.tinte ?? PALETA_CATEGORIAS[0]!.tinte;
}

export function siguienteColor(color: string): string {
  const i = PALETA_CATEGORIAS.findIndex((p) => p.color === color);
  return colorPorPosicion(i + 1).color;
}

const ROL_LABEL: Record<string, string> = {
  admin: "Gerente General",
  pablo: "Administrador",
  asistente: "Ver y editar",
  socio: "Solo ver",
  cliente: "Consulta",
};

/** Nombre visible. Nunca devuelve el rol interno. */
export function etiquetaRol(rol: string | null | undefined): string {
  if (!rol) return "";
  return ROL_LABEL[rol] ?? "Persona";
}

/** "Lunes 2 de noviembre", en hora de Chile y no la del servidor. */
export function fechaMenu(fecha: Date): string {
  const partes = new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Santiago",
  }).formatToParts(fecha);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === tipo)?.value ?? "";
  const dia = valor("weekday");
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${valor("day")} de ${valor("month")}`;
}

function enRuta(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Fachadas se abre por rewrite desde `/trabajos/c/…/s/…` o directo en `/trabajos/fachadas/…`. */
export function subtipoActivo(
  pathname: string,
  categoriaId: string,
  subtipoId: string,
): boolean {
  return (
    enRuta(pathname, subtipoHref(categoriaId, subtipoId)) ||
    enRuta(pathname, `/trabajos/fachadas/${categoriaId}/${subtipoId}`)
  );
}

export function moduloActivo(pathname: string, href: string): boolean {
  return enRuta(pathname, href);
}
