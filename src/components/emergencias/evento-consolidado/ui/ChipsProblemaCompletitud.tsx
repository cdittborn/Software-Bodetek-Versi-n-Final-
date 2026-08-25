import { EtiquetaFaltaBadge } from "@/components/emergencias/evento-consolidado/ui/EtiquetaFaltaBadge";
import {
  TIPOS_PROBLEMA,
  TIPO_PROBLEMA_LABEL,
  type ProblemasFiltracion,
} from "@/lib/filtracion/problemas";
import { campoFalta, type ResultadoCompletitud } from "@/lib/filtracion/completitud";
import { idDescripcionProblema, idPlanProblema } from "@/lib/filtracion/problemas";
import { cn } from "@/lib/utils";

type ChipsProblemaCompletitudProps = {
  problemas: ProblemasFiltracion;
  completitud: ResultadoCompletitud;
  className?: string;
};

export function ChipsProblemaCompletitud({
  problemas,
  completitud,
  className,
}: ChipsProblemaCompletitudProps) {
  const activos = TIPOS_PROBLEMA.filter((t) => problemas[t].activo);
  if (activos.length === 0) {
    return (
      <div className={className}>
        <EtiquetaFaltaBadge />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {activos.map((tipo) => {
        const faltaDesc = campoFalta(completitud, idDescripcionProblema(tipo));
        const faltaPlan = campoFalta(completitud, idPlanProblema(tipo));
        const incompleto = faltaDesc || faltaPlan;
        return (
          <span
            key={tipo}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
              incompleto
                ? "border-[#f2c3c8] bg-[#fdeced] text-[#a4131f]"
                : "border-emerald-200 bg-emerald-50 text-emerald-800",
            )}
          >
            {TIPO_PROBLEMA_LABEL[tipo]}
            {faltaDesc ? <span>· problema</span> : null}
            {faltaPlan ? <span>· plan</span> : null}
          </span>
        );
      })}
    </div>
  );
}
