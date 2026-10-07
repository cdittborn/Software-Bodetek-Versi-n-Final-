import { TIPO_PROBLEMA_LABEL, type TipoProblema } from "@/lib/filtracion/problemas";
import { parseHorasHombre } from "@/lib/informe-seguro/formato";
import type { FuenteMedia, FuenteProyecto } from "@/lib/informe-seguro/fuente";

/**
 * Reservada para la etapa de cotizaciones. Hoy el armado deja el arreglo vacío
 * y la vista pública no lo muestra.
 */
export type CotizacionInforme = {
  id: string;
  proveedor: string;
  numero: string | null;
  fecha: string | null;
  valorNeto: number;
  pdfKey: string | null;
  cubre: {
    trabajoId: string;
    tipo: TipoProblema;
    valorAsignado: number | null;
  }[];
};

export type EjecutorInforme =
  | "maestros_bodetek"
  | "proveedor_externo"
  | "sin_ejecutor";

export const EJECUTOR_INFORME_LABEL: Record<EjecutorInforme, string> = {
  maestros_bodetek: "Maestros Bodetek",
  proveedor_externo: "Proveedor externo",
  sin_ejecutor: "Sin ejecutor",
};

export type MediaSnapshot = {
  trabajoMediaId: string;
  key: string;
  thumbnailKey: string | null;
  tipoArchivo: "foto" | "video";
  nombre: string | null;
  orden: number;
  esPortada: boolean;
};

export type SubproyectoSnapshot = {
  trabajoId: string;
  tipo: TipoProblema;
  tipoLabel: string;
  descripcionSeguro: string;
  ejecutor: EjecutorInforme;
  ejecutorLabel: string;
  proveedorNombre: string | null;
  horasMaestros: number | null;
  media: MediaSnapshot[];
};

export type RecintoSnapshot = {
  trabajoId: string;
  codigo: string;
  titulo: string;
  recintoEtiqueta: string;
  descripcionSeguro: string;
  horasMaestros: number;
  media: MediaSnapshot[];
  subproyectos: SubproyectoSnapshot[];
};

export type EncabezadoInforme = {
  nombre: string;
  nombreEvento: string;
  fechaEvento: string | null;
  direccionCentro: string;
  numeroSiniestro: string | null;
  numeroPoliza: string | null;
  contactoBodetek: string;
  fechaEmision: string | null;
};

export type SnapshotInformeSeguro = {
  version: 1;
  cotizaciones: CotizacionInforme[];
  encabezado: EncabezadoInforme;
  resumen: {
    recintos: number;
    subproyectos: number;
    maestros: number;
    proveedor: number;
    horasMaestros: number;
  };
  recintos: RecintoSnapshot[];
};

export type SeleccionRecinto = {
  trabajoId: string;
  incluido: boolean;
  descripcionSeguro: string;
  descripcionValidada: boolean;
};

export type SeleccionSubproyecto = {
  trabajoId: string;
  tipo: TipoProblema;
  incluido: boolean;
  descripcionSeguro: string;
};

export type SeleccionMedia = {
  trabajoMediaId: string;
  incluido: boolean;
  orden: number;
  esPortada: boolean;
};

export type BorradorInforme = {
  encabezado: EncabezadoInforme;
  tokenExpira: string | null;
  recintos: SeleccionRecinto[];
  subproyectos: SeleccionSubproyecto[];
  media: SeleccionMedia[];
};

function ejecutorDe(valor: FuenteProyecto["subproyectos"][number]["ejecutor"]): EjecutorInforme {
  if (valor === "maestros_bodetek" || valor === "proveedor_externo") return valor;
  return "sin_ejecutor";
}

function texto(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function opcional(value: string | null | undefined): string | null {
  const t = texto(value);
  return t ? t : null;
}

function mediaDelGrupo(
  proyecto: FuenteProyecto,
  tipo: TipoProblema | null,
): FuenteMedia[] {
  const activos = new Set(proyecto.subproyectos.map((s) => s.tipo));
  return proyecto.media.filter((m) => {
    if (tipo == null) {
      return m.problemaTipo == null || !activos.has(m.problemaTipo);
    }
    return m.problemaTipo === tipo;
  });
}

function materializarMedia(
  items: FuenteMedia[],
  seleccion: Map<string, SeleccionMedia>,
): MediaSnapshot[] {
  const rows = items.map((m, index) => {
    const sel = seleccion.get(m.id);
    return {
      trabajoMediaId: m.id,
      key: m.key,
      thumbnailKey: m.thumbnailKey,
      tipoArchivo: m.tipoArchivo,
      nombre: m.nombre,
      orden: sel?.orden ?? index,
      esPortada: sel?.esPortada ?? false,
      incluido: sel?.incluido === true,
    };
  });
  const incluidos = rows
    .filter((r) => r.incluido)
    .sort((a, b) => a.orden - b.orden || a.trabajoMediaId.localeCompare(b.trabajoMediaId));

  let portada = false;
  for (const row of incluidos) {
    if (row.tipoArchivo !== "foto") {
      row.esPortada = false;
      continue;
    }
    if (row.esPortada && !portada) {
      portada = true;
      continue;
    }
    row.esPortada = false;
  }
  if (!portada) {
    const primera = incluidos.find((r) => r.tipoArchivo === "foto");
    if (primera) primera.esPortada = true;
  }

  return incluidos.map(({ incluido: _incluido, ...row }) => row);
}

export function borradorInicial(
  fuente: FuenteProyecto[],
  encabezado: EncabezadoInforme,
  tokenExpira: string | null = null,
): BorradorInforme {
  const recintos: SeleccionRecinto[] = [];
  const subproyectos: SeleccionSubproyecto[] = [];
  const media: SeleccionMedia[] = [];

  for (const proyecto of fuente) {
    recintos.push({
      trabajoId: proyecto.trabajoId,
      incluido: true,
      descripcionSeguro: "",
      descripcionValidada: false,
    });
    for (const sub of proyecto.subproyectos) {
      subproyectos.push({
        trabajoId: proyecto.trabajoId,
        tipo: sub.tipo,
        incluido: true,
        descripcionSeguro: "",
      });
      const fotos = mediaDelGrupo(proyecto, sub.tipo);
      let portada = false;
      fotos.forEach((m, index) => {
        const esPortada = m.tipoArchivo === "foto" && !portada;
        if (esPortada) portada = true;
        media.push({
          trabajoMediaId: m.id,
          incluido: false,
          orden: index,
          esPortada,
        });
      });
    }
    const sueltas = mediaDelGrupo(proyecto, null);
    let portadaRecinto = false;
    sueltas.forEach((m, index) => {
      const esPortada = m.tipoArchivo === "foto" && !portadaRecinto;
      if (esPortada) portadaRecinto = true;
      media.push({
        trabajoMediaId: m.id,
        incluido: false,
        orden: index,
        esPortada,
      });
    });
  }

  return { encabezado, tokenExpira, recintos, subproyectos, media };
}

export function combinarBorrador(
  fuente: FuenteProyecto[],
  guardado: BorradorInforme | null,
  encabezadoSiNuevo: EncabezadoInforme,
): BorradorInforme {
  const base = borradorInicial(
    fuente,
    guardado?.encabezado ?? encabezadoSiNuevo,
    guardado?.tokenExpira ?? null,
  );
  if (!guardado) return base;
  const rec = new Map(guardado.recintos.map((r) => [r.trabajoId, r]));
  const sub = new Map(guardado.subproyectos.map((s) => [`${s.trabajoId}:${s.tipo}`, s]));
  const media = new Map(guardado.media.map((m) => [m.trabajoMediaId, m]));
  return {
    encabezado: guardado.encabezado,
    tokenExpira: guardado.tokenExpira,
    recintos: base.recintos.map((r) => {
      const guardado = rec.get(r.trabajoId);
      if (!guardado) return r;
      return { ...r, ...guardado, descripcionValidada: guardado.descripcionValidada === true };
    }),
    subproyectos: base.subproyectos.map(
      (s) => sub.get(`${s.trabajoId}:${s.tipo}`) ?? s,
    ),
    media: base.media.map((m) => media.get(m.trabajoMediaId) ?? m),
  };
}

export function armarSnapshot(
  fuente: FuenteProyecto[],
  borrador: BorradorInforme,
): SnapshotInformeSeguro {
  const recSel = new Map(borrador.recintos.map((r) => [r.trabajoId, r]));
  const subSel = new Map(
    borrador.subproyectos.map((s) => [`${s.trabajoId}:${s.tipo}`, s]),
  );
  const mediaSel = new Map(borrador.media.map((m) => [m.trabajoMediaId, m]));

  const recintos: RecintoSnapshot[] = [];

  for (const proyecto of fuente) {
    const rec = recSel.get(proyecto.trabajoId);
    if (rec && !rec.incluido) continue;

    const subproyectos: SubproyectoSnapshot[] = [];
    for (const sub of proyecto.subproyectos) {
      const sel = subSel.get(`${proyecto.trabajoId}:${sub.tipo}`);
      if (sel && !sel.incluido) continue;
      const ejecutor = ejecutorDe(sub.ejecutor);
      const horas =
        ejecutor === "maestros_bodetek" ? parseHorasHombre(sub.horasTexto) : null;
      subproyectos.push({
        trabajoId: proyecto.trabajoId,
        tipo: sub.tipo,
        tipoLabel: TIPO_PROBLEMA_LABEL[sub.tipo],
        descripcionSeguro: texto(sel?.descripcionSeguro),
        ejecutor,
        ejecutorLabel: EJECUTOR_INFORME_LABEL[ejecutor],
        proveedorNombre:
          ejecutor === "proveedor_externo" ? sub.proveedorNombre : null,
        horasMaestros: horas,
        media: materializarMedia(mediaDelGrupo(proyecto, sub.tipo), mediaSel),
      });
    }

    if (subproyectos.length === 0) continue;

    const horasMaestros = subproyectos.reduce(
      (acc, s) => acc + (s.horasMaestros ?? 0),
      0,
    );

    recintos.push({
      trabajoId: proyecto.trabajoId,
      codigo: proyecto.codigo,
      titulo: proyecto.titulo,
      recintoEtiqueta: proyecto.recintoEtiqueta,
      descripcionSeguro: texto(rec?.descripcionSeguro),
      horasMaestros,
      media: materializarMedia(mediaDelGrupo(proyecto, null), mediaSel),
      subproyectos,
    });
  }

  const subproyectos = recintos.flatMap((r) => r.subproyectos);
  const encabezado = borrador.encabezado;

  return {
    version: 1,
    cotizaciones: [],
    encabezado: {
      nombre: texto(encabezado.nombre),
      nombreEvento: texto(encabezado.nombreEvento),
      fechaEvento: opcional(encabezado.fechaEvento),
      direccionCentro: texto(encabezado.direccionCentro),
      numeroSiniestro: opcional(encabezado.numeroSiniestro),
      numeroPoliza: opcional(encabezado.numeroPoliza),
      contactoBodetek: texto(encabezado.contactoBodetek),
      fechaEmision: opcional(encabezado.fechaEmision),
    },
    resumen: {
      recintos: recintos.length,
      subproyectos: subproyectos.length,
      maestros: subproyectos.filter((s) => s.ejecutor === "maestros_bodetek").length,
      proveedor: subproyectos.filter((s) => s.ejecutor === "proveedor_externo").length,
      horasMaestros: subproyectos.reduce((acc, s) => acc + (s.horasMaestros ?? 0), 0),
    },
    recintos,
  };
}
