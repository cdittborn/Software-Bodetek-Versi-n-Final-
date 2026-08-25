import type { DesgloseGravedad } from "@/lib/filtracion/filtrosEvento";
import { BarraSegmentadaGravedad } from "@/components/emergencias/evento-dashboard/ui/BarraSegmentadaGravedad";
import { ChipsGravedad } from "@/components/emergencias/evento-dashboard/ui/ChipsGravedad";
import { cn } from "@/lib/utils";

type EventoDashboardTarjetaTotalProps = {
  total: number;
  desglose: DesgloseGravedad;
  activo: boolean;
  onVerTodos: () => void;
  compact?: boolean;
};

export function EventoDashboardTarjetaTotal({
  total,
  desglose,
  activo,
  onVerTodos,
  compact = false,
}: EventoDashboardTarjetaTotalProps) {
  return (
    <button
      type="button"
      onClick={onVerTodos}
      className={cn(
        "min-h-[44px] w-full rounded-xl border p-4 text-left text-white transition-colors md:p-5",
        "bg-[#18181b] hover:bg-[#27272a]",
        activo && "ring-2 ring-[#c8102e] ring-offset-2 ring-offset-background",
      )}
    >
      <p className="text-xs font-semibold tracking-wide text-white/70 uppercase">
        Total proyectos · Ver todos
      </p>
      <p
        className={cn(
          "mt-2 font-bold leading-none",
          compact ? "text-3xl" : "text-[52px]",
        )}
      >
        {total}
      </p>
      <p className="mt-1 text-sm text-white/70">
        filtración-proyecto{total === 1 ? "" : "s"} del evento
      </p>
      <BarraSegmentadaGravedad
        desglose={desglose}
        className="mt-4"
        altura="h-2"
      />
      <ChipsGravedad
        desglose={desglose}
        invertido
        className="mt-3"
        compact={compact}
      />
    </button>
  );
}
