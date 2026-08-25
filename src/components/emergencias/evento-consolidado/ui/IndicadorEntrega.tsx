import { formatFechaCl } from "@/lib/trabajos";
import {
  EtiquetaAtrasadaBadge,
  EtiquetaFaltaBadge,
} from "@/components/emergencias/evento-consolidado/ui/EtiquetaFaltaBadge";
import { cn } from "@/lib/utils";

type IndicadorEntregaProps = {
  fechaEstimada?: string | null;
  fechaReal?: string | null;
  atrasada: boolean;
  className?: string;
};

export function IndicadorEntrega({
  fechaEstimada,
  fechaReal,
  atrasada,
  className,
}: IndicadorEntregaProps) {
  return (
    <div className={cn("space-y-0.5 text-xs", className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        {fechaEstimada ? (
          <span className={atrasada ? "font-semibold text-amber-900" : undefined}>
            {formatFechaCl(fechaEstimada)}
          </span>
        ) : (
          <EtiquetaFaltaBadge />
        )}
        {atrasada ? <EtiquetaAtrasadaBadge /> : null}
      </div>
      <div>
        {fechaReal ? (
          <span className="text-muted-foreground">{formatFechaCl(fechaReal)}</span>
        ) : (
          <EtiquetaFaltaBadge />
        )}
      </div>
    </div>
  );
}
