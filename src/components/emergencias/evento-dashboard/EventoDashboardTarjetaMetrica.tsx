import type { DesgloseGravedad } from "@/lib/filtracion/filtrosEvento";
import { BarraCompletitud } from "@/components/emergencias/evento-consolidado/ui/BarraCompletitud";
import { ChipsGravedad } from "@/components/emergencias/evento-dashboard/ui/ChipsGravedad";
import { TarjetaFiltroBase } from "@/components/emergencias/evento-dashboard/ui/TarjetaFiltroBase";
import { cn } from "@/lib/utils";

type EventoDashboardTarjetaMetricaProps = {
  label: string;
  hint?: string;
  nota?: string;
  dotClass: string;
  count: number;
  total: number;
  activo: boolean;
  onToggle: () => void;
  desgloseEnCondicion: DesgloseGravedad;
  desgloseResto?: DesgloseGravedad;
  compact?: boolean;
};

export function EventoDashboardTarjetaMetrica({
  label,
  hint,
  nota,
  dotClass,
  count,
  total,
  activo,
  onToggle,
  desgloseEnCondicion,
  desgloseResto,
  compact = false,
}: EventoDashboardTarjetaMetricaProps) {
  const porcentaje = total === 0 ? 0 : Math.round((count / total) * 100);

  return (
    <TarjetaFiltroBase activo={activo} onClick={onToggle}>
      <p className="text-xs font-semibold tracking-wide text-[#71717a] uppercase leading-snug">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className={cn("size-2 shrink-0 rounded-full", dotClass)} aria-hidden />
        <span
          className={cn(
            "font-bold",
            compact ? "text-2xl" : "text-[34px] leading-none",
          )}
        >
          {count}
        </span>
        <span className="text-sm text-muted-foreground">de {total}</span>
      </div>
      <BarraCompletitud
        porcentaje={porcentaje}
        className="mt-3 h-1.5"
      />
      <ChipsGravedad
        desglose={desgloseEnCondicion}
        prefix={desgloseResto ? "En esta condición:" : undefined}
        compact
        className="mt-2"
      />
      {desgloseResto ? (
        <ChipsGravedad
          desglose={desgloseResto}
          prefix="Resto:"
          compact
          className="mt-1.5"
        />
      ) : null}
      {hint ? (
        <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
      {nota ? (
        <p className="mt-1 text-xs font-medium text-[#c8102e]">{nota}</p>
      ) : null}
    </TarjetaFiltroBase>
  );
}
