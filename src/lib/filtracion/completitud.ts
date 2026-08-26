import type {
  EmergenciaConMedia,
  EmergenciaListado,
  EmergenciaListadoMedia,
  TrabajoMediaItem,
} from "@/lib/trabajos";
import {
  concatenarDescripcion,
  concatenarPlan,
  estadoAgregadoFicha,
  ejecutadoPorAgregadoFicha,
  fechaEntregaEstimadaFicha,
  fechaEntregaRealFicha,
  hidratarProblemasDesdeFicha,
  horasMaestrosAgregadas,
  idCotizacionProblema,
  idDescripcionProblema,
  idEjecutadoPorProblema,
  idFechaEstimadaProblema,
  idHorasProblema,
  idPlanProblema,
  idProveedorProblema,
  parseProblemas,
  TIPO_PROBLEMA_LABEL,
  TIPOS_PROBLEMA,
  tiposActivos,
  type ProblemasFiltracion,
  type TipoProblema,
} from "@/lib/filtracion/problemas";

export type FiltracionFormValues = {
  recintoId: string;
  fechaEntregaEstimada?: string;
  estado?: string;
  ejecutadoPor?: string;
  proveedorId?: string;
  fechaEntregaReal?: string;
  horasMaestros?: string;
  numeroCotizacion?: string;
  valorRecinto?: string;
  valorTotalCotizacion?: string;
  problemas: ProblemasFiltracion;
};

export type ItemCompletitud = {
  id: string;
  label: string;
  completo: boolean;
};

export type ResultadoCompletitud = {
  items: ItemCompletitud[];
  aplicables: ItemCompletitud[];
  completos: number;
  total: number;
  faltantes: ItemCompletitud[];
  porcentaje: number;
  todoCompleto: boolean;
};

export type MediaCounts = {
  antes: number;
  despues: number;
  planoAgua: number;
  planoReparacion: number;
  cotizacion: number;
  cotizacionPorTipo: Record<TipoProblema, number>;
};

export type ProyectoFiltracionEnriquecido = EmergenciaConMedia & {
  completitud: ResultadoCompletitud;
  sinDespues: boolean;
  entregaAtrasada: boolean;
  problemas: ProblemasFiltracion;
};

export type AgregadoCompletitudEvento = {
  porcentajeGlobal: number;
  proyectosCompletos: number;
  totalProyectos: number;
  topFaltantes: { id: string; label: string; count: number }[];
};

const NONE = "none";

function parseMontoLocal(value: string): number | null {
  const t = value.trim().replace(/\./g, "").replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function ejecutadoEsProveedor(ejecutadoPor: string): boolean {
  return ejecutadoPor === "proveedor_externo" || ejecutadoPor === "ambos";
}

export function ejecutadoEsMaestros(ejecutadoPor: string): boolean {
  return ejecutadoPor === "maestros_bodetek";
}

function cotizacionPorTipoVacio(): Record<TipoProblema, number> {
  return {
    techumbre: 0,
    canaleta: 0,
    cielo: 0,
    electrico: 0,
    suciedad_piso: 0,
  };
}

function buildResultado(items: ItemCompletitud[]): ResultadoCompletitud {
  const aplicables = items;
  const completos = aplicables.filter((i) => i.completo).length;
  const total = aplicables.length;
  const faltantes = aplicables.filter((i) => !i.completo);
  const porcentaje = total === 0 ? 100 : Math.round((completos / total) * 100);

  return {
    items,
    aplicables,
    completos,
    total,
    faltantes,
    porcentaje,
    todoCompleto: faltantes.length === 0,
  };
}

export function calcularCompletitud(
  values: FiltracionFormValues,
  media: MediaCounts,
): ResultadoCompletitud {
  const items: ItemCompletitud[] = [
    {
      id: "recinto",
      label: "Recinto",
      completo: values.recintoId.trim().length > 0,
    },
    {
      id: "tipos_problema",
      label: "Tipo de problema",
      completo: tiposActivos(values.problemas).length > 0,
    },
  ];

  for (const tipo of TIPOS_PROBLEMA) {
    if (!values.problemas[tipo].activo) continue;
    const label = TIPO_PROBLEMA_LABEL[tipo];
    const bloque = values.problemas[tipo];
    items.push(
      {
        id: idDescripcionProblema(tipo),
        label: `${label} · problema`,
        completo: bloque.descripcion.trim().length > 0,
      },
      {
        id: idPlanProblema(tipo),
        label: `${label} · plan`,
        completo: bloque.plan.trim().length > 0,
      },
      {
        id: idEjecutadoPorProblema(tipo),
        label: `${label} · ejecutado por`,
        completo: bloque.ejecutadoPor.length > 0,
      },
      {
        id: idFechaEstimadaProblema(tipo),
        label: `${label} · fecha estimada`,
        completo: bloque.fechaEntregaEstimada.trim().length > 0,
      },
    );

    if (ejecutadoEsProveedor(bloque.ejecutadoPor)) {
      items.push(
        {
          id: idProveedorProblema(tipo),
          label: `${label} · proveedor`,
          completo:
            bloque.proveedorId.length > 0 && bloque.proveedorId !== NONE,
        },
        {
          id: idCotizacionProblema(tipo),
          label: `${label} · cotización`,
          completo:
            bloque.numeroCotizacion.trim().length > 0 &&
            parseMontoLocal(bloque.valorRecinto) != null &&
            parseMontoLocal(bloque.valorTotalCotizacion) != null &&
            (media.cotizacionPorTipo[tipo] ?? 0) > 0,
        },
      );
    } else if (ejecutadoEsMaestros(bloque.ejecutadoPor)) {
      items.push({
        id: idHorasProblema(tipo),
        label: `${label} · horas`,
        completo: (parseMontoLocal(bloque.horasMaestros) ?? 0) > 0,
      });
    }
  }

  items.push(
    {
      id: "plano_agua",
      label: "Plano agua",
      completo: media.planoAgua > 0,
    },
    {
      id: "plano_reparacion",
      label: "Plano reparación",
      completo: media.planoReparacion > 0,
    },
  );

  return buildResultado(items);
}

export function mediaCotizacionDeTipo(
  items: TrabajoMediaItem[],
  tipo: TipoProblema,
  problemas: ProblemasFiltracion,
): TrabajoMediaItem[] {
  const cotizaciones = items.filter((m) => m.tipo === "cotizacion");
  const typed = cotizaciones.filter((m) => m.problema_tipo === tipo);
  if (typed.length > 0) return typed;

  const untyped = cotizaciones.filter((m) => !m.problema_tipo);
  if (untyped.length === 0) return [];

  const proveedorTipos = tiposActivos(problemas).filter(
    (t) => problemas[t].ejecutadoPor === "proveedor_externo",
  );
  if (proveedorTipos[0] === tipo) return untyped;
  if (
    proveedorTipos.length === 0 &&
    tiposActivos(problemas)[0] === tipo
  ) {
    return untyped;
  }
  return [];
}

export function mediaCountsFromItems(
  items: TrabajoMediaItem[],
  pending: Partial<Record<TrabajoMediaItem["tipo"], number>> = {},
  opciones: {
    problemas?: ProblemasFiltracion;
    pendingCotizacionPorTipo?: Partial<Record<TipoProblema, number>>;
  } = {},
): MediaCounts {
  const count = (tipo: TrabajoMediaItem["tipo"]) =>
    items.filter((m) => m.tipo === tipo).length + (pending[tipo] ?? 0);

  const problemas = opciones.problemas;
  const cotizacionPorTipo = cotizacionPorTipoVacio();
  if (problemas) {
    for (const tipo of TIPOS_PROBLEMA) {
      cotizacionPorTipo[tipo] =
        mediaCotizacionDeTipo(items, tipo, problemas).length +
        (opciones.pendingCotizacionPorTipo?.[tipo] ?? 0);
    }
  } else {
    cotizacionPorTipo.techumbre = count("cotizacion");
  }

  return {
    antes: count("antes"),
    despues: count("despues"),
    planoAgua: count("plano_agua") + count("plano_filtraciones"),
    planoReparacion: count("plano_reparacion"),
    cotizacion: count("cotizacion"),
    cotizacionPorTipo,
  };
}

export function mediaCountsFromEmergenciaMedia(
  media: EmergenciaListadoMedia,
  problemas?: ProblemasFiltracion,
): MediaCounts {
  const items = [
    ...media.antes,
    ...media.despues,
    ...media.plano_agua,
    ...media.plano_reparacion,
    ...media.cotizacion,
  ];
  return mediaCountsFromItems(items, {}, { problemas });
}

export function problemasDesdeEmergencia(
  e: Pick<
    EmergenciaListado,
    | "problemas"
    | "descripcion"
    | "plan_accion"
    | "ejecutado_por"
    | "estado"
    | "fecha_entrega_estimada"
    | "fecha_termino"
    | "horas_maestros_bodetek"
    | "proveedor_id"
    | "numero_cotizacion"
    | "valor_reparacion"
    | "valor_total_cotizacion"
  >,
): ProblemasFiltracion {
  return hidratarProblemasDesdeFicha(
    parseProblemas(e.problemas, e.descripcion, e.plan_accion),
    {
      ejecutadoPor: e.ejecutado_por,
      estado: e.estado,
      fechaEstimada: e.fecha_entrega_estimada,
      fechaReal: e.fecha_termino,
      horas: e.horas_maestros_bodetek,
      proveedorId: e.proveedor_id,
      numeroCotizacion: e.numero_cotizacion,
      valorRecinto: e.valor_reparacion,
      valorTotal: e.valor_total_cotizacion,
    },
  );
}

/** Fecha de entrega estimada a nivel de ficha: MAX de los problemas activos. */
export function fechaEntregaEstimadaDesdeEmergencia(
  e: Pick<
    EmergenciaListado,
    | "problemas"
    | "descripcion"
    | "plan_accion"
    | "ejecutado_por"
    | "estado"
    | "fecha_entrega_estimada"
    | "fecha_termino"
    | "horas_maestros_bodetek"
    | "proveedor_id"
    | "numero_cotizacion"
    | "valor_reparacion"
    | "valor_total_cotizacion"
  >,
): string {
  const problemas = problemasDesdeEmergencia(e);
  return fechaEntregaEstimadaFicha(problemas);
}

export function fechaEntregaRealDesdeEmergencia(
  e: Pick<
    EmergenciaListado,
    | "problemas"
    | "descripcion"
    | "plan_accion"
    | "ejecutado_por"
    | "estado"
    | "fecha_entrega_estimada"
    | "fecha_termino"
    | "horas_maestros_bodetek"
    | "proveedor_id"
    | "numero_cotizacion"
    | "valor_reparacion"
    | "valor_total_cotizacion"
  >,
): string {
  return fechaEntregaRealFicha(problemasDesdeEmergencia(e));
}

export function valoresCompletitudDesdeEmergencia(
  e: EmergenciaConMedia,
): FiltracionFormValues {
  const problemas = problemasDesdeEmergencia(e);
  return {
    recintoId: e.recinto_id ?? "",
    fechaEntregaEstimada: fechaEntregaEstimadaFicha(problemas),
    estado: estadoAgregadoFicha(problemas),
    ejecutadoPor: ejecutadoPorAgregadoFicha(problemas) ?? NONE,
    proveedorId: e.proveedor_id ?? NONE,
    fechaEntregaReal: fechaEntregaRealFicha(problemas),
    horasMaestros:
      horasMaestrosAgregadas(problemas) != null
        ? String(horasMaestrosAgregadas(problemas))
        : "",
    numeroCotizacion: e.numero_cotizacion ?? "",
    valorRecinto:
      e.valor_reparacion != null ? String(e.valor_reparacion) : "",
    valorTotalCotizacion:
      e.valor_total_cotizacion != null
        ? String(e.valor_total_cotizacion)
        : "",
    problemas,
  };
}

export function calcularCompletitudDesdeEmergencia(
  e: EmergenciaConMedia,
): ResultadoCompletitud {
  const problemas = problemasDesdeEmergencia(e);
  return calcularCompletitud(
    valoresCompletitudDesdeEmergencia(e),
    mediaCountsFromEmergenciaMedia(e.media, problemas),
  );
}

export function cotizacionCompletaDesdeEmergencia(
  e: EmergenciaConMedia,
): boolean {
  const problemas = problemasDesdeEmergencia(e);
  const media = mediaCountsFromEmergenciaMedia(e.media, problemas);
  const proveedores = tiposActivos(problemas).filter(
    (t) => problemas[t].ejecutadoPor === "proveedor_externo",
  );
  if (proveedores.length === 0) {
    return (
      Boolean(e.numero_cotizacion?.trim()) &&
      e.valor_reparacion != null &&
      e.valor_total_cotizacion != null &&
      e.media.cotizacion.length > 0
    );
  }
  return proveedores.every((tipo) => {
    const b = problemas[tipo];
    return (
      b.numeroCotizacion.trim().length > 0 &&
      parseMontoLocal(b.valorRecinto) != null &&
      parseMontoLocal(b.valorTotalCotizacion) != null &&
      media.cotizacionPorTipo[tipo] > 0
    );
  });
}

export function sinDespues(e: EmergenciaConMedia): boolean {
  return e.media.despues.length === 0;
}

export function esEntregaAtrasada(
  fechaEstimada: string | null | undefined,
  fechaReal: string | null | undefined,
  ahora: Date = new Date(),
): boolean {
  if (!fechaEstimada || fechaReal) return false;
  const hoy = new Date(ahora);
  hoy.setHours(0, 0, 0, 0);
  const estimada = new Date(`${fechaEstimada}T12:00:00`);
  return estimada < hoy;
}

export function entregaAtrasadaDesdeProblemas(
  problemas: ProblemasFiltracion,
  ahora: Date = new Date(),
): boolean {
  return tiposActivos(problemas).some((tipo) =>
    esEntregaAtrasada(
      problemas[tipo].fechaEntregaEstimada || null,
      problemas[tipo].fechaEntregaReal || null,
      ahora,
    ),
  );
}

export function entregaAtrasada(e: EmergenciaConMedia): boolean {
  return entregaAtrasadaDesdeProblemas(problemasDesdeEmergencia(e));
}

export function enriquecerProyecto(
  e: EmergenciaConMedia,
): ProyectoFiltracionEnriquecido {
  const problemas = problemasDesdeEmergencia(e);
  const fechaEstimada = fechaEntregaEstimadaFicha(problemas) || null;
  const fechaReal = fechaEntregaRealFicha(problemas) || null;
  return {
    ...e,
    problemas,
    fecha_entrega_estimada: fechaEstimada,
    fecha_termino: fechaReal,
    ejecutado_por: ejecutadoPorAgregadoFicha(problemas),
    estado: estadoAgregadoFicha(problemas),
    horas_maestros_bodetek: horasMaestrosAgregadas(problemas),
    completitud: calcularCompletitudDesdeEmergencia(e),
    sinDespues: sinDespues(e),
    entregaAtrasada: entregaAtrasadaDesdeProblemas(problemas),
  };
}

export function enriquecerProyectos(
  emergencias: EmergenciaConMedia[],
): ProyectoFiltracionEnriquecido[] {
  return emergencias.map(enriquecerProyecto);
}

export function calcularAgregadoEvento(
  proyectos: ProyectoFiltracionEnriquecido[],
): AgregadoCompletitudEvento {
  let sumCompletos = 0;
  let sumTotal = 0;
  let proyectosCompletos = 0;
  const faltanteCounts = new Map<string, { label: string; count: number }>();

  for (const p of proyectos) {
    sumCompletos += p.completitud.completos;
    sumTotal += p.completitud.total;
    if (p.completitud.todoCompleto) proyectosCompletos += 1;
    for (const f of p.completitud.faltantes) {
      const prev = faltanteCounts.get(f.id);
      if (prev) prev.count += 1;
      else faltanteCounts.set(f.id, { label: f.label, count: 1 });
    }
  }

  const topFaltantes = [...faltanteCounts.entries()]
    .map(([id, { label, count }]) => ({ id, label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return {
    porcentajeGlobal:
      sumTotal === 0 ? 100 : Math.round((sumCompletos / sumTotal) * 100),
    proyectosCompletos,
    totalProyectos: proyectos.length,
    topFaltantes,
  };
}

export function colorBarraCompletitud(porcentaje: number): string {
  if (porcentaje >= 100) return "bg-emerald-600";
  if (porcentaje >= 50) return "bg-amber-500";
  return "bg-[#c8102e]";
}

export function campoFalta(
  completitud: ResultadoCompletitud,
  id: string,
): boolean {
  return completitud.faltantes.some((f) => f.id === id);
}

export function textosDiagnostico(problemas: ProblemasFiltracion): {
  descripcion: string;
  plan: string;
} {
  return {
    descripcion: concatenarDescripcion(problemas),
    plan: concatenarPlan(problemas),
  };
}

export function hayProblemaProveedor(problemas: ProblemasFiltracion): boolean {
  return tiposActivos(problemas).some(
    (t) => problemas[t].ejecutadoPor === "proveedor_externo",
  );
}
