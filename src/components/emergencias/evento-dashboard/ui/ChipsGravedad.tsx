import type { DesgloseGravedad } from "@/lib/filtracion/filtrosEvento";
import {
  GRAVEDAD_LLUVIAS_BADGE,
  GRAVEDAD_LLUVIAS_LABEL,
  type GravedadLluvias,
} from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type ChipsGravedadProps = {
  desglose: DesgloseGravedad;
  prefix?: string;
  compact?: boolean;
  invertido?: boolean;
  className?: string;
};

const ORDEN: GravedadLluvias[] = ["critico", "medio", "bajo"];

export function ChipsGravedad({
  desglose,
  prefix,
  compact = false,
  invertido = false,
  className,
}: ChipsGravedadProps) {
  const items = ORDEN.filter((g) => desglose[g] > 0);
  if (items.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {prefix ? (
        <span className="text-[11px] text-muted-foreground">{prefix}</span>
      ) : null}
      {items.map((g) => (
        <span
          key={g}
          className={cn(
            "rounded-md px-1.5 py-0.5 font-medium",
            compact ? "text-[10px]" : "text-[11px]",
            invertido
              ? "border border-white/20 bg-white/10 text-white"
              : cn(GRAVEDAD_LLUVIAS_BADGE[g], "border border-transparent"),
          )}
        >
          {GRAVEDAD_LLUVIAS_LABEL[g]} {desglose[g]}
        </span>
      ))}
    </div>
  );
}
