import type { TrabajoMediaItem } from "@/lib/trabajos";

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

type MediaCounts = {
  antes: number;
  despues: number;
  planoAgua: number;
  planoReparacion: number;
  cotizacion: number;
};

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
        values.ejecutadoPor.length > 0 && values.ejecutadoPor !== "none",
    },
  ];

  if (ejecutadoEsProveedor(values.ejecutadoPor)) {
    items.push(
      {
        id: "proveedor",
        label: "Proveedor",
        completo:
          values.proveedorId.length > 0 && values.proveedorId !== "none",
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

export function campoFalta(
  completitud: ResultadoCompletitud,
  id: string,
): boolean {
  return completitud.faltantes.some((f) => f.id === id);
}
