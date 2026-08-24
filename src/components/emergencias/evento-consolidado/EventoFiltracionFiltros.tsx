"use client";

import { Input } from "@/components/ui/input";
import {
  ESTADOS_LLUVIAS,
  ESTADO_TRABAJO_LABEL,
  GRAVEDADES_LLUVIAS,
  GRAVEDAD_LLUVIAS_LABEL,
  type EstadoLluvias,
  type GravedadLluvias,
} from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type EventoFiltracionFiltrosProps = {
  busqueda: string;
  onBusquedaChange: (v: string) => void;
  gravedades: GravedadLluvias[];
  estados: EstadoLluvias[];
  onToggleGravedad: (g: GravedadLluvias) => void;
  onToggleEstado: (e: EstadoLluvias) => void;
  visibles: number;
  total: number;
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-[44px] shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-[#c8102e] bg-[#fdeced] text-[#a4131f]"
          : "border-border bg-muted/50 text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

export function EventoFiltracionFiltros({
  busqueda,
  onBusquedaChange,
  gravedades,
  estados,
  onToggleGravedad,
  onToggleEstado,
  visibles,
  total,
}: EventoFiltracionFiltrosProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Input
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          placeholder="Buscar recinto, arrendatario o N° de cotización"
          className="h-11 max-w-xl"
        />
        <p className="text-sm text-muted-foreground lg:text-right">
          {visibles} de {total} mostrados
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {GRAVEDADES_LLUVIAS.map((g) => (
          <Chip
            key={g}
            active={gravedades.includes(g)}
            onClick={() => onToggleGravedad(g)}
          >
            {GRAVEDAD_LLUVIAS_LABEL[g]}
          </Chip>
        ))}
        <span className="mx-1 w-px shrink-0 self-stretch bg-border" aria-hidden />
        {ESTADOS_LLUVIAS.map((e) => (
          <Chip
            key={e}
            active={estados.includes(e)}
            onClick={() => onToggleEstado(e)}
          >
            {ESTADO_TRABAJO_LABEL[e]}
          </Chip>
        ))}
      </div>
    </div>
  );
}
