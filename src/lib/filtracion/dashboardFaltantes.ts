import type { GravedadLluvias } from "@/lib/trabajos";
import {
  mediaCotizacionDeTipo,
  mediaCountsFromEmergenciaMedia,
  type ProyectoFiltracionEnriquecido,
} from "@/lib/filtracion/completitud";
import { desgloseGravedadVacio, ordenarProyectos } from "@/lib/filtracion/filtrosEvento";
import {
  TIPOS_PROBLEMA,
  TIPO_PROBLEMA_LABEL,
  normalizarEstadoProblema,
  tiposActivos,
  type BloqueProblema,
  type TipoProblema,
} from "@/lib/filtracion/problemas";

export type PopupItem = {
  key: string;
  proyecto: ProyectoFiltracionEnriquecido;
  tipos: TipoProblema[];
};

export type CeldaFaltante = {
  n: number;
  items: PopupItem[];
};

export type FilaGravedad = {
  critico: CeldaFaltante;
  medio: CeldaFaltante;
  bajo: CeldaFaltante;
  total: CeldaFaltante;
};

export type FilaTipo = Record<TipoProblema, CeldaFaltante> & {
  total: CeldaFaltante;
};

export type EstadoS4Proveedor =
  | "asignado_proveedor_sin_empezar"
  | "en_proceso"
  | "ejecutado_pendiente_entrega"
  | "entregado";

export type EstadoS4Maestros =
  | "asignado_maestros_sin_empezar"
  | "en_proceso"
  | "ejecutado_pendiente_entrega"
  | "entregado";

export const ESTADOS_S4_PROVEEDOR: {
  key: EstadoS4Proveedor;
  label: string;
}[] = [
  {
    key: "asignado_proveedor_sin_empezar",
    label: "Asignado a proveedor externo - Sin empezar",
  },
  { key: "en_proceso", label: "En proceso" },
  {
    key: "ejecutado_pendiente_entrega",
    label: "Ejecutado - Pendiente entrega",
  },
  { key: "entregado", label: "Entregado" },
];

export const ESTADOS_S4_MAESTROS: {
  key: EstadoS4Maestros;
  label: string;
}[] = [
  {
    key: "asignado_maestros_sin_empezar",
    label: "Asignado a maestros Bodetek - Sin empezar",
  },
  { key: "en_proceso", label: "En proceso" },
  {
    key: "ejecutado_pendiente_entrega",
    label: "Ejecutado - Pendiente entrega",
  },
  { key: "entregado", label: "Entregado" },
];

export const TIPO_PROBLEMA_CHIP: Record<TipoProblema, string> = {
  techumbre: "bg-sky-100 text-sky-800",
  cielo: "bg-violet-100 text-violet-800",
  electrico: "bg-amber-100 text-amber-800",
  suciedad_piso: "bg-stone-200 text-stone-800",
};

export const TIPO_PROBLEMA_BARRA: Record<TipoProblema, string> = {
  techumbre: "bg-sky-500",
  cielo: "bg-violet-500",
  electrico: "bg-amber-500",
  suciedad_piso: "bg-stone-500",
};

export type DesgloseTipo = Record<TipoProblema, number>;

export type PopupAbierto = {
  titulo: string;
  categoria: string;
  items: PopupItem[];
};

export type DashboardFaltantes = {
  heros: {
    proyectos: CeldaFaltante;
    subproyectos: CeldaFaltante;
    sinAsignar: CeldaFaltante;
    sinFotosDespues: CeldaFaltante;
    totalSubproyectos: number;
    totalProyectos: number;
    proveedorN: number;
    maestrosN: number;
    desgloseProyectos: ReturnType<typeof desgloseGravedadVacio>;
    desgloseSubproyectos: DesgloseTipo;
    desgloseSinFotosDespues: ReturnType<typeof desgloseGravedadVacio>;
  };
  s1: {
    cantidad: FilaGravedad;
    sinFotosAntes: FilaGravedad;
    sinFotosDespues: FilaGravedad;
    sinPlanoAgua: FilaGravedad;
    sinPlanoReparacion: FilaGravedad;
    cienProveedor: FilaGravedad;
    cienMaestros: FilaGravedad;
    mix: FilaGravedad;
  };
  s2: {
    cantidad: FilaTipo;
    sinAsignar: FilaTipo;
    proveedor: FilaTipo;
    maestros: FilaTipo;
  };
  s3: {
    totalSub: CeldaFaltante;
    descripcion: {
      anotado: CeldaFaltante;
      falta: CeldaFaltante;
      total: CeldaFaltante;
    };
    plan: {
      anotado: CeldaFaltante;
      falta: CeldaFaltante;
      total: CeldaFaltante;
    };
  };
  s4a: {
    total: FilaGravedad;
    sinCotizacion: FilaGravedad;
    sinValorRecinto: FilaGravedad;
    sinValorTotal: FilaGravedad;
    estados: Record<EstadoS4Proveedor, CeldaFaltante>;
  };
  s4b: {
    total: FilaGravedad;
    conHoras: CeldaFaltante;
    horasTrabajo: number;
    totalMaestros: number;
    estados: Record<EstadoS4Maestros, CeldaFaltante>;
  };
};

type Subproyecto = {
  proyecto: ProyectoFiltracionEnriquecido;
  tipo: TipoProblema;
  bloque: BloqueProblema;
};

const GRAVEDADES: GravedadLluvias[] = ["critico", "medio", "bajo"];

function celdaVacia(): CeldaFaltante {
  return { n: 0, items: [] };
}

export function celdaDe(items: PopupItem[]): CeldaFaltante {
  return { n: items.length, items };
}

export function itemFicha(p: ProyectoFiltracionEnriquecido): PopupItem {
  return {
    key: p.id,
    proyecto: p,
    tipos: tiposActivos(p.problemas),
  };
}

export function itemSub(
  p: ProyectoFiltracionEnriquecido,
  tipo: TipoProblema,
): PopupItem {
  return {
    key: `${p.id}:${tipo}`,
    proyecto: p,
    tipos: [tipo],
  };
}

export function listarSubproyectos(
  proyectos: ProyectoFiltracionEnriquecido[],
): Subproyecto[] {
  const out: Subproyecto[] = [];
  for (const p of proyectos) {
    for (const tipo of TIPOS_PROBLEMA) {
      if (p.problemas[tipo].activo) {
        out.push({ proyecto: p, tipo, bloque: p.problemas[tipo] });
      }
    }
  }
  return out;
}

function evidencias(p: ProyectoFiltracionEnriquecido) {
  return mediaCountsFromEmergenciaMedia(p.media, p.problemas);
}

export function esSinFotosAntes(p: ProyectoFiltracionEnriquecido): boolean {
  return evidencias(p).antes === 0;
}

export function esSinFotosDespues(p: ProyectoFiltracionEnriquecido): boolean {
  return evidencias(p).despues === 0;
}

export function esSinPlanoAgua(p: ProyectoFiltracionEnriquecido): boolean {
  return evidencias(p).planoAgua === 0;
}

export function esSinPlanoReparacion(p: ProyectoFiltracionEnriquecido): boolean {
  return evidencias(p).planoReparacion === 0;
}

export function esCienPorEjecutor(
  p: ProyectoFiltracionEnriquecido,
  ejecutor: "proveedor_externo" | "maestros_bodetek",
): boolean {
  const activos = tiposActivos(p.problemas);
  if (activos.length === 0) return false;
  return activos.every((t) => p.problemas[t].ejecutadoPor === ejecutor);
}

export function esMixEjecutores(p: ProyectoFiltracionEnriquecido): boolean {
  const set = new Set(
    tiposActivos(p.problemas)
      .map((t) => p.problemas[t].ejecutadoPor)
      .filter((v) => v === "proveedor_externo" || v === "maestros_bodetek"),
  );
  return set.has("proveedor_externo") && set.has("maestros_bodetek");
}

function campoLleno(value: string): boolean {
  return value.trim().length > 0;
}

export function tieneCotizacionAdjunta(
  p: ProyectoFiltracionEnriquecido,
  tipo: TipoProblema,
): boolean {
  return mediaCotizacionDeTipo(p.media.cotizacion, tipo, p.problemas).length > 0;
}

export function parseHorasHombre(value: string): number {
  const t = value.trim().replace(",", ".");
  if (!t) return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

function filaGravedadDeFichas(
  fichas: ProyectoFiltracionEnriquecido[],
): FilaGravedad {
  const items = fichas.map(itemFicha);
  const por: FilaGravedad = {
    critico: celdaVacia(),
    medio: celdaVacia(),
    bajo: celdaVacia(),
    total: celdaDe(items),
  };
  for (const g of GRAVEDADES) {
    por[g] = celdaDe(items.filter((i) => i.proyecto.gravedad === g));
  }
  return por;
}

function filaTipoDeSubs(subs: Subproyecto[]): FilaTipo {
  const fila = {
    techumbre: celdaVacia(),
    cielo: celdaVacia(),
    electrico: celdaVacia(),
    suciedad_piso: celdaVacia(),
    total: celdaDe(subs.map((s) => itemSub(s.proyecto, s.tipo))),
  } as FilaTipo;
  for (const tipo of TIPOS_PROBLEMA) {
    fila[tipo] = celdaDe(
      subs.filter((s) => s.tipo === tipo).map((s) => itemSub(s.proyecto, s.tipo)),
    );
  }
  return fila;
}

function filaGravedadDeSubs(subs: Subproyecto[]): FilaGravedad {
  const items = subs.map((s) => itemSub(s.proyecto, s.tipo));
  const por: FilaGravedad = {
    critico: celdaVacia(),
    medio: celdaVacia(),
    bajo: celdaVacia(),
    total: celdaDe(items),
  };
  for (const g of GRAVEDADES) {
    por[g] = celdaDe(items.filter((i) => i.proyecto.gravedad === g));
  }
  return por;
}

export function desgloseDeCelda(celda: CeldaFaltante) {
  const d = desgloseGravedadVacio();
  for (const item of celda.items) {
    const g = item.proyecto.gravedad;
    if (g === "critico" || g === "medio" || g === "bajo") d[g] += 1;
  }
  return d;
}

export function desgloseTipoDeCelda(celda: CeldaFaltante): DesgloseTipo {
  const d: DesgloseTipo = {
    techumbre: 0,
    cielo: 0,
    electrico: 0,
    suciedad_piso: 0,
  };
  for (const item of celda.items) {
    for (const tipo of item.tipos) d[tipo] += 1;
  }
  return d;
}

export function desgloseDeFilaGravedad(fila: FilaGravedad) {
  return {
    critico: fila.critico.n,
    medio: fila.medio.n,
    bajo: fila.bajo.n,
  };
}

export function desgloseDeFilaTipo(fila: FilaTipo): DesgloseTipo {
  return {
    techumbre: fila.techumbre.n,
    cielo: fila.cielo.n,
    electrico: fila.electrico.n,
    suciedad_piso: fila.suciedad_piso.n,
  };
}

export function nombreFichaPopup(p: ProyectoFiltracionEnriquecido): string {
  return (
    p.recinto_codigo?.trim() ||
    p.recinto_nombre?.trim() ||
    p.titulo?.trim() ||
    "Sin recinto"
  );
}

export function etiquetaTipo(tipo: TipoProblema): string {
  return TIPO_PROBLEMA_LABEL[tipo];
}

export function calcularDashboardFaltantes(
  proyectosIn: ProyectoFiltracionEnriquecido[],
): DashboardFaltantes {
  const proyectos = ordenarProyectos(proyectosIn);
  const subs = listarSubproyectos(proyectos);

  const sinAsignarSubs = subs.filter((s) => !s.bloque.ejecutadoPor);
  const proveedorSubs = subs.filter(
    (s) => s.bloque.ejecutadoPor === "proveedor_externo",
  );
  const maestrosSubs = subs.filter(
    (s) => s.bloque.ejecutadoPor === "maestros_bodetek",
  );

  const proyectosCelda = celdaDe(proyectos.map(itemFicha));
  const subproyectosCelda = celdaDe(subs.map((s) => itemSub(s.proyecto, s.tipo)));
  const sinFotosDespuesFichas = proyectos.filter(esSinFotosDespues);
  const sinFotosDespuesCelda = celdaDe(sinFotosDespuesFichas.map(itemFicha));

  const conHoras = maestrosSubs.filter((s) => campoLleno(s.bloque.horasMaestros));
  const horasTrabajo = maestrosSubs.reduce(
    (acc, s) => acc + parseHorasHombre(s.bloque.horasMaestros),
    0,
  );

  return {
    heros: {
      proyectos: proyectosCelda,
      subproyectos: subproyectosCelda,
      sinAsignar: celdaDe(sinAsignarSubs.map((s) => itemSub(s.proyecto, s.tipo))),
      sinFotosDespues: sinFotosDespuesCelda,
      totalSubproyectos: subs.length,
      totalProyectos: proyectos.length,
      proveedorN: proveedorSubs.length,
      maestrosN: maestrosSubs.length,
      desgloseProyectos: desgloseDeCelda(proyectosCelda),
      desgloseSubproyectos: desgloseTipoDeCelda(subproyectosCelda),
      desgloseSinFotosDespues: desgloseDeCelda(sinFotosDespuesCelda),
    },
    s1: {
      cantidad: filaGravedadDeFichas(proyectos),
      sinFotosAntes: filaGravedadDeFichas(proyectos.filter(esSinFotosAntes)),
      sinFotosDespues: filaGravedadDeFichas(sinFotosDespuesFichas),
      sinPlanoAgua: filaGravedadDeFichas(proyectos.filter(esSinPlanoAgua)),
      sinPlanoReparacion: filaGravedadDeFichas(
        proyectos.filter(esSinPlanoReparacion),
      ),
      cienProveedor: filaGravedadDeFichas(
        proyectos.filter((p) => esCienPorEjecutor(p, "proveedor_externo")),
      ),
      cienMaestros: filaGravedadDeFichas(
        proyectos.filter((p) => esCienPorEjecutor(p, "maestros_bodetek")),
      ),
      mix: filaGravedadDeFichas(proyectos.filter(esMixEjecutores)),
    },
    s2: {
      cantidad: filaTipoDeSubs(subs),
      sinAsignar: filaTipoDeSubs(sinAsignarSubs),
      proveedor: filaTipoDeSubs(proveedorSubs),
      maestros: filaTipoDeSubs(maestrosSubs),
    },
    s3: {
      totalSub: subproyectosCelda,
      descripcion: {
        anotado: celdaDe(
          subs
            .filter((s) => campoLleno(s.bloque.descripcion))
            .map((s) => itemSub(s.proyecto, s.tipo)),
        ),
        falta: celdaDe(
          subs
            .filter((s) => !campoLleno(s.bloque.descripcion))
            .map((s) => itemSub(s.proyecto, s.tipo)),
        ),
        total: subproyectosCelda,
      },
      plan: {
        anotado: celdaDe(
          subs
            .filter((s) => campoLleno(s.bloque.plan))
            .map((s) => itemSub(s.proyecto, s.tipo)),
        ),
        falta: celdaDe(
          subs
            .filter((s) => !campoLleno(s.bloque.plan))
            .map((s) => itemSub(s.proyecto, s.tipo)),
        ),
        total: subproyectosCelda,
      },
    },
    s4a: {
      total: filaGravedadDeSubs(proveedorSubs),
      sinCotizacion: filaGravedadDeSubs(
        proveedorSubs.filter((s) => !tieneCotizacionAdjunta(s.proyecto, s.tipo)),
      ),
      sinValorRecinto: filaGravedadDeSubs(
        proveedorSubs.filter((s) => !campoLleno(s.bloque.valorRecinto)),
      ),
      sinValorTotal: filaGravedadDeSubs(
        proveedorSubs.filter((s) => !campoLleno(s.bloque.valorTotalCotizacion)),
      ),
      estados: {
        asignado_proveedor_sin_empezar: celdaDe(
          proveedorSubs
            .filter(
              (s) =>
                normalizarEstadoProblema(s.bloque.estado) ===
                "asignado_proveedor_sin_empezar",
            )
            .map((s) => itemSub(s.proyecto, s.tipo)),
        ),
        en_proceso: celdaDe(
          proveedorSubs
            .filter(
              (s) => normalizarEstadoProblema(s.bloque.estado) === "en_proceso",
            )
            .map((s) => itemSub(s.proyecto, s.tipo)),
        ),
        ejecutado_pendiente_entrega: celdaDe(
          proveedorSubs
            .filter(
              (s) =>
                normalizarEstadoProblema(s.bloque.estado) ===
                "ejecutado_pendiente_entrega",
            )
            .map((s) => itemSub(s.proyecto, s.tipo)),
        ),
        entregado: celdaDe(
          proveedorSubs
            .filter(
              (s) => normalizarEstadoProblema(s.bloque.estado) === "entregado",
            )
            .map((s) => itemSub(s.proyecto, s.tipo)),
        ),
      },
    },
    s4b: {
      total: filaGravedadDeSubs(maestrosSubs),
      conHoras: celdaDe(conHoras.map((s) => itemSub(s.proyecto, s.tipo))),
      horasTrabajo,
      totalMaestros: maestrosSubs.length,
      estados: {
        asignado_maestros_sin_empezar: celdaDe(
          maestrosSubs
            .filter(
              (s) =>
                normalizarEstadoProblema(s.bloque.estado) ===
                "asignado_maestros_sin_empezar",
            )
            .map((s) => itemSub(s.proyecto, s.tipo)),
        ),
        en_proceso: celdaDe(
          maestrosSubs
            .filter(
              (s) => normalizarEstadoProblema(s.bloque.estado) === "en_proceso",
            )
            .map((s) => itemSub(s.proyecto, s.tipo)),
        ),
        ejecutado_pendiente_entrega: celdaDe(
          maestrosSubs
            .filter(
              (s) =>
                normalizarEstadoProblema(s.bloque.estado) ===
                "ejecutado_pendiente_entrega",
            )
            .map((s) => itemSub(s.proyecto, s.tipo)),
        ),
        entregado: celdaDe(
          maestrosSubs
            .filter(
              (s) => normalizarEstadoProblema(s.bloque.estado) === "entregado",
            )
            .map((s) => itemSub(s.proyecto, s.tipo)),
        ),
      },
    },
  };
}

export function abrirCelda(
  titulo: string,
  categoria: string,
  celda: CeldaFaltante,
): PopupAbierto {
  return { titulo, categoria, items: celda.items };
}
