"use client";

import { Paperclip } from "lucide-react";
import type { EmergenciaListadoMedia } from "@/lib/trabajos";

type FiltracionMediaResumenProps = {
  media: EmergenciaListadoMedia;
  pending: {
    antes: number;
    despues: number;
    plano_agua: number;
    plano_reparacion: number;
    cotizacion: number;
  };
  mostrarCotizacion: boolean;
  onNavigate: (sectionId: string) => void;
};

type ResumenItem = {
  label: string;
  count: number;
  sectionId: string;
};

export function FiltracionMediaResumen({
  media,
  pending,
  mostrarCotizacion,
  onNavigate,
}: FiltracionMediaResumenProps) {
  const items: ResumenItem[] = [
    {
      label: "Antes",
      count: media.antes.length + pending.antes,
      sectionId: "sec-03",
    },
    {
      label: "Después",
      count: media.despues.length + pending.despues,
      sectionId: "sec-03",
    },
    {
      label: "Plano agua",
      count: media.plano_agua.length + pending.plano_agua,
      sectionId: "sec-04",
    },
    {
      label: "Plano reparación",
      count: media.plano_reparacion.length + pending.plano_reparacion,
      sectionId: "sec-04",
    },
  ];

  if (mostrarCotizacion) {
    items.push({
      label: "Cotización",
      count: media.cotizacion.length + pending.cotizacion,
      sectionId: "sec-02",
    });
  }

  const conArchivos = items.filter((item) => item.count > 0);
  const total = conArchivos.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) return null;

  return (
    <div className="shrink-0 border-b border-[#e4e4e7] bg-[#f8faf8] px-4 py-2.5 md:px-6">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
        <Paperclip className="size-3.5 shrink-0" aria-hidden />
        <span>
          {total} archivo{total === 1 ? "" : "s"} subido{total === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {conArchivos.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onNavigate(item.sectionId)}
            className="rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 transition-colors hover:bg-emerald-50"
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>
    </div>
  );
}
