import type { FuenteProyecto } from "@/lib/informe-seguro/fuente";
import type { BorradorInforme } from "@/lib/informe-seguro/snapshot";

export const MENSAJE_GUARDADO_OTRA_PESTANA =
  "Este informe se guardó desde otra pestaña o dispositivo. Recarga para ver lo último antes de seguir.";

export function firmaRecinto(
  fuente: FuenteProyecto[],
  borrador: BorradorInforme,
  trabajoId: string,
): string {
  const recinto = borrador.recintos.find((r) => r.trabajoId === trabajoId);
  const proyecto = fuente.find((p) => p.trabajoId === trabajoId);
  const incluido = new Map(borrador.media.map((m) => [m.trabajoMediaId, m.incluido]));
  const archivos = (proyecto?.media ?? [])
    .map((m) => m.id)
    .sort()
    .map((id) => [id, incluido.get(id) === true]);
  const textos = borrador.subproyectos
    .filter((s) => s.trabajoId === trabajoId)
    .map((s) => [s.tipo, s.incluido, s.descripcionSeguro.trim()] as const)
    .sort((a, b) => a[0].localeCompare(b[0]));
  return JSON.stringify({
    validada: recinto?.descripcionValidada === true,
    descripcion: (recinto?.descripcionSeguro ?? "").trim(),
    textos,
    archivos,
  });
}

export function firmasPorRecinto(
  fuente: FuenteProyecto[],
  borrador: BorradorInforme,
): Record<string, string> {
  const firmas: Record<string, string> = {};
  for (const recinto of borrador.recintos) {
    firmas[recinto.trabajoId] = firmaRecinto(fuente, borrador, recinto.trabajoId);
  }
  return firmas;
}

/**
 * Un borrador viejo de la pestaña no trae version: usa la de esta carga.
 * null explícito se conserva: al cargar no había fila, y si ahora existe hay que rechazar.
 */
export function completarVersionesRecinto(
  borrador: BorradorInforme,
  cargado: BorradorInforme,
): BorradorInforme {
  const versiones = new Map(cargado.recintos.map((recinto) => [recinto.trabajoId, recinto.version]));
  return {
    ...borrador,
    recintos: borrador.recintos.map((recinto) => {
      if (typeof recinto.version === "number" || recinto.version === null) return recinto;
      const cargada = versiones.get(recinto.trabajoId);
      return { ...recinto, version: typeof cargada === "number" ? cargada : null };
    }),
  };
}

/** Solo los recintos distintos de la última carga o del último guardado. */
export function recortarBorradorGuardado(
  fuente: FuenteProyecto[],
  borrador: BorradorInforme,
  firmasBase: Record<string, string> | null,
): BorradorInforme {
  const ids = new Set(
    borrador.recintos
      .filter((recinto) => {
        if (!firmasBase) return true;
        return firmasBase[recinto.trabajoId] !== firmaRecinto(fuente, borrador, recinto.trabajoId);
      })
      .map((recinto) => recinto.trabajoId),
  );
  const archivos = new Set(
    fuente
      .filter((proyecto) => ids.has(proyecto.trabajoId))
      .flatMap((proyecto) => proyecto.media.map((m) => m.id)),
  );
  return {
    ...borrador,
    recintos: borrador.recintos
      .filter((recinto) => ids.has(recinto.trabajoId))
      .map((recinto) => ({
        ...recinto,
        version: typeof recinto.version === "number" ? recinto.version : null,
      })),
    subproyectos: borrador.subproyectos.filter((s) => ids.has(s.trabajoId)),
    media: borrador.media.filter((m) => archivos.has(m.trabajoMediaId)),
  };
}
