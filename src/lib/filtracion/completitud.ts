import type {
  EmergenciaConMedia,
  EmergenciaListadoMedia,
  TrabajoMediaItem,
} from "@/lib/trabajos";

export type FiltracionFormValues = {
  recintoId: string;
  descripcion: string;
  planAccion: string;
  fechaEntregaEstimada: string;
  estado: string;
  ejecutadoPor: string;
  proveedorId: string;
  fechaEntregaReal: string;
  horasMaestros: string;
  numeroCotizacion: string;
  valorRecinto: string;
  valorTotalCotizacion: string;
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
};

export type ProyectoFiltracionEnriquecido = EmergenciaConMedia & {
  completitud: ResultadoCompletitud;
  sinDespues: boolean;
  entregaAtrasada: boolean;
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

function ejecutadoEsProveedor(ejecutadoPor: string): boolean {
  return ejecutadoPor === "proveedor_externo" || ejecutadoPor === "ambos";
}

function ejecutadoEsMaestros(ejecutadoPor: string): boolean {
  return ejecutadoPor === "maestros_bodetek";
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
      id: "fecha_entrega",
      label: "Fecha entrega",
      completo: values.fechaEntregaEstimada.trim().length > 0,
    },
    {
      id: "descripcion",
      label: "Descripción",
      completo: values.descripcion.trim().length > 0,
    },
    {
      id: "plan_accion",
      label: "Plan de acción",
      completo: values.planAccion.trim().length > 0,
    },
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
    {
      id: "ejecutado_por",
      label: "Ejecutado por",
      completo:
        values.ejecutadoPor.length > 0 && values.ejecutadoPor !== NONE,
    },
  ];

  if (ejecutadoEsProveedor(values.ejecutadoPor)) {
    items.push(
      {
        id: "proveedor",
        label: "Proveedor",
        completo:
          values.proveedorId.length > 0 && values.proveedorId !== NONE,
      },
      {
        id: "cotizacion",
        label: "Cotización",
        completo:
          values.numeroCotizacion.trim().length > 0 &&
          parseMontoLocal(values.valorRecinto) != null &&
          parseMontoLocal(values.valorTotalCotizacion) != null &&
          media.cotizacion > 0,
      },
    );
  } else if (ejecutadoEsMaestros(values.ejecutadoPor)) {
    items.push({
      id: "horas_maestros",
      label: "Horas maestros",
      completo: (parseMontoLocal(values.horasMaestros) ?? 0) > 0,
    });
  }

  return buildResultado(items);
}

export function mediaCountsFromItems(
  items: TrabajoMediaItem[],
  pending: Partial<Record<TrabajoMediaItem["tipo"], number>> = {},
): MediaCounts {
  const count = (tipo: TrabajoMediaItem["tipo"]) =>
    items.filter((m) => m.tipo === tipo).length + (pending[tipo] ?? 0);

  return {
    antes: count("antes"),
    despues: count("despues"),
    planoAgua: count("plano_agua") + count("plano_filtraciones"),
    planoReparacion: count("plano_reparacion"),
    cotizacion: count("cotizacion"),
  };
}

export function mediaCountsFromEmergenciaMedia(
  media: EmergenciaListadoMedia,
): MediaCounts {
  return {
    antes: media.antes.length,
    despues: media.despues.length,
    planoAgua: media.plano_agua.length,
    planoReparacion: media.plano_reparacion.length,
    cotizacion: media.cotizacion.length,
  };
}

export function valoresCompletitudDesdeEmergencia(
  e: EmergenciaConMedia,
): FiltracionFormValues {
  return {
    recintoId: e.recinto_id ?? "",
    descripcion: e.descripcion ?? "",
    planAccion: e.plan_accion ?? "",
    fechaEntregaEstimada: e.fecha_entrega_estimada ?? "",
    estado: e.estado,
    ejecutadoPor: e.ejecutado_por ?? NONE,
    proveedorId: e.proveedor_id ?? NONE,
    fechaEntregaReal: e.fecha_termino ?? "",
    horasMaestros:
      e.horas_maestros_bodetek != null ? String(e.horas_maestros_bodetek) : "",
    numeroCotizacion: e.numero_cotizacion ?? "",
    valorRecinto:
      e.valor_reparacion != null ? String(e.valor_reparacion) : "",
    valorTotalCotizacion:
      e.valor_total_cotizacion != null
        ? String(e.valor_total_cotizacion)
        : "",
  };
}

export function calcularCompletitudDesdeEmergencia(
  e: EmergenciaConMedia,
): ResultadoCompletitud {
  return calcularCompletitud(
    valoresCompletitudDesdeEmergencia(e),
    mediaCountsFromEmergenciaMedia(e.media),
  );
}

export function cotizacionCompletaDesdeEmergencia(
  e: EmergenciaConMedia,
): boolean {
  return (
    Boolean(e.numero_cotizacion?.trim()) &&
    e.valor_reparacion != null &&
    e.valor_total_cotizacion != null &&
    e.media.cotizacion.length > 0
  );
}

export function sinDespues(e: EmergenciaConMedia): boolean {
  return e.media.despues.length === 0;
}

export function entregaAtrasada(e: EmergenciaConMedia): boolean {
  if (!e.fecha_entrega_estimada || e.fecha_termino) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const estimada = new Date(`${e.fecha_entrega_estimada}T12:00:00`);
  return estimada < hoy;
}

export function enriquecerProyecto(
  e: EmergenciaConMedia,
): ProyectoFiltracionEnriquecido {
  return {
    ...e,
    completitud: calcularCompletitudDesdeEmergencia(e),
    sinDespues: sinDespues(e),
    entregaAtrasada: entregaAtrasada(e),
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
