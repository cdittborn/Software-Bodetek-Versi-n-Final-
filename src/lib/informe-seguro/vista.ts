import type { FuenteMedia, FuenteProyecto, MomentoMedia } from "@/lib/informe-seguro/fuente";
import type { BorradorInforme } from "@/lib/informe-seguro/snapshot";

export type ResumenPantalla = {
  recintos: number;
  validadas: number;
  seleccionados: number;
  totalMedia: number;
  conDespues: number;
};

export const AVISO_CAMBIOS_SIN_GUARDAR =
  "Tienes cambios sin guardar; el liquidador verá lo último guardado";

export function textoQuePaso(descripcionSeguro: string, notaAnotada: string): string {
  const propio = descripcionSeguro.trim();
  return propio || notaAnotada.trim();
}

export function textoEnInforme(descripcionSeguro: string): boolean {
  return descripcionSeguro.trim().length > 0;
}

/** Sin fila, o con incluido false, el archivo no está en el informe. */
export function mediaSeleccionada(borrador: BorradorInforme, id: string): boolean {
  const sel = borrador.media.find((m) => m.trabajoMediaId === id);
  return sel?.incluido === true;
}

export function puedeValidarRecinto(borrador: BorradorInforme, trabajoId: string): boolean {
  return borrador.subproyectos.some(
    (s) => s.trabajoId === trabajoId && textoEnInforme(s.descripcionSeguro),
  );
}

export function conteoArchivosRecinto(
  proyecto: FuenteProyecto,
  borrador: BorradorInforme,
): { enInforme: number; total: number } {
  return {
    total: proyecto.media.length,
    enInforme: proyecto.media.filter((m) => mediaSeleccionada(borrador, m.id)).length,
  };
}

export function resumenPantalla(
  fuente: FuenteProyecto[],
  borrador: BorradorInforme,
): ResumenPantalla {
  const recintos = new Map(borrador.recintos.map((r) => [r.trabajoId, r]));
  let seleccionados = 0;
  let totalMedia = 0;
  let conDespues = 0;
  let validadas = 0;
  for (const proyecto of fuente) {
    if (recintos.get(proyecto.trabajoId)?.descripcionValidada) validadas += 1;
    let despues = false;
    for (const media of proyecto.media) {
      totalMedia += 1;
      const on = mediaSeleccionada(borrador, media.id);
      if (on) seleccionados += 1;
      if (on && media.momento === "despues") despues = true;
    }
    if (despues) conDespues += 1;
  }
  return {
    recintos: fuente.length,
    validadas,
    seleccionados,
    totalMedia,
    conDespues,
  };
}

export function contarMomento(
  items: FuenteMedia[],
  momento: MomentoMedia,
): { fotos: number; videos: number } {
  let fotos = 0;
  let videos = 0;
  for (const item of items) {
    if (item.momento !== momento) continue;
    if (item.tipoArchivo === "video") videos += 1;
    else fotos += 1;
  }
  return { fotos, videos };
}

/** Lo que ve el liquidador: solo recintos validados, textos guardados y archivos con incluido true. */
export function armarVistaLiquidador(
  fuente: FuenteProyecto[],
  borrador: BorradorInforme,
): { fuente: FuenteProyecto[]; borrador: BorradorInforme } {
  const textos = new Map(
    borrador.subproyectos.map((s) => [`${s.trabajoId}:${s.tipo}`, s.descripcionSeguro.trim()]),
  );
  const validados = new Set(
    borrador.recintos.filter((r) => r.descripcionValidada).map((r) => r.trabajoId),
  );
  const vistaFuente = fuente
    .filter((proyecto) => validados.has(proyecto.trabajoId))
    .map((proyecto) => ({
      ...proyecto,
      notasInternas: "",
      subproyectos: proyecto.subproyectos.flatMap((sub) => {
        const texto = textos.get(`${proyecto.trabajoId}:${sub.tipo}`) ?? "";
        if (!texto) return [];
        return [
          {
            ...sub,
            horasTexto: "",
            proveedorNombre: null,
            ejecutor: "" as const,
            notasInternas: "",
            notaAnotada: "",
          },
        ];
      }),
      media: proyecto.media.filter((m) => mediaSeleccionada(borrador, m.id)),
    }));
  return {
    fuente: vistaFuente,
    borrador: {
      ...borrador,
      subproyectos: borrador.subproyectos.map((s) => ({
        ...s,
        descripcionSeguro: textos.get(`${s.trabajoId}:${s.tipo}`) ?? "",
      })),
    },
  };
}
