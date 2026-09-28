/** Prefijos R2 de Fachadas. Sin imports de servidor: lo usa el cliente al subir. */

export const FACHADA_UUID_RE =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";

export type PrefijoFachada =
  | { kind: "general" | "plano"; fachadaId: string }
  | { kind: "fotos" | "docs"; fachadaId: string; intervencionId: string };

const FACHADA_GENERAL_RE = new RegExp(
  `^fachadas/(${FACHADA_UUID_RE})/general$`,
  "i",
);
const FACHADA_PLANO_RE = new RegExp(
  `^fachadas/(${FACHADA_UUID_RE})/plano$`,
  "i",
);
const FACHADA_FOTOS_RE = new RegExp(
  `^fachadas/(${FACHADA_UUID_RE})/intervenciones/(${FACHADA_UUID_RE})/fotos$`,
  "i",
);
const FACHADA_DOCS_RE = new RegExp(
  `^fachadas/(${FACHADA_UUID_RE})/intervenciones/(${FACHADA_UUID_RE})/docs$`,
  "i",
);

export function parsearCarpetaFachada(carpeta: string): PrefijoFachada | null {
  const general = FACHADA_GENERAL_RE.exec(carpeta);
  if (general) return { kind: "general", fachadaId: general[1] };
  const plano = FACHADA_PLANO_RE.exec(carpeta);
  if (plano) return { kind: "plano", fachadaId: plano[1] };
  const fotos = FACHADA_FOTOS_RE.exec(carpeta);
  if (fotos) {
    return { kind: "fotos", fachadaId: fotos[1], intervencionId: fotos[2] };
  }
  const docs = FACHADA_DOCS_RE.exec(carpeta);
  if (docs) {
    return { kind: "docs", fachadaId: docs[1], intervencionId: docs[2] };
  }
  return null;
}

export function carpetaFachadaGeneral(fachadaId: string): string {
  return `fachadas/${fachadaId}/general`;
}

export function carpetaFachadaPlano(fachadaId: string): string {
  return `fachadas/${fachadaId}/plano`;
}

export function carpetaIntervencionFotos(
  fachadaId: string,
  intervencionId: string,
): string {
  return `fachadas/${fachadaId}/intervenciones/${intervencionId}/fotos`;
}

export function carpetaIntervencionDocs(
  fachadaId: string,
  intervencionId: string,
): string {
  return `fachadas/${fachadaId}/intervenciones/${intervencionId}/docs`;
}
