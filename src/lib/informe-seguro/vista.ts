import type { FuenteMedia, FuenteProyecto, MomentoMedia } from "@/lib/informe-seguro/fuente";
import type { BorradorInforme } from "@/lib/informe-seguro/snapshot";

export type ResumenPantalla = {
  recintos: number;
  validadas: number;
  seleccionados: number;
  totalMedia: number;
  conDespues: number;
};

export function textoQuePaso(descripcionSeguro: string, notaAnotada: string): string {
  const propio = descripcionSeguro.trim();
  return propio || notaAnotada.trim();
}

export function mediaSeleccionada(borrador: BorradorInforme, id: string): boolean {
  const sel = borrador.media.find((m) => m.trabajoMediaId === id);
  return sel ? sel.incluido : true;
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

/** Lo que ve el liquidador: texto resuelto y solo archivos marcados. Sin plan ni horas. */
export function armarVistaLiquidador(
  fuente: FuenteProyecto[],
  borrador: BorradorInforme,
): { fuente: FuenteProyecto[]; borrador: BorradorInforme } {
  const textos = new Map(
    borrador.subproyectos.map((s) => [`${s.trabajoId}:${s.tipo}`, s.descripcionSeguro]),
  );
  const vistaFuente = fuente.map((proyecto) => ({
    ...proyecto,
    notasInternas: "",
    subproyectos: proyecto.subproyectos.map((sub) => ({
      ...sub,
      horasTexto: "",
      proveedorNombre: null,
      ejecutor: "" as const,
      notasInternas: "",
      notaAnotada: "",
    })),
    media: proyecto.media.filter((m) => mediaSeleccionada(borrador, m.id)),
  }));
  return {
    fuente: vistaFuente,
    borrador: {
      ...borrador,
      subproyectos: borrador.subproyectos.map((s) => {
        const nota =
          fuente
            .find((p) => p.trabajoId === s.trabajoId)
            ?.subproyectos.find((sub) => sub.tipo === s.tipo)?.notaAnotada ?? "";
        return {
          ...s,
          descripcionSeguro: textoQuePaso(textos.get(`${s.trabajoId}:${s.tipo}`) ?? "", nota),
        };
      }),
    },
  };
}
