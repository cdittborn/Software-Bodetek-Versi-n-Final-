import { TIPOS_PROBLEMA } from "@/lib/filtracion/problemas";
import {
  TIPO_PROBLEMA_BARRA,
  type DesgloseTipo,
} from "@/lib/filtracion/dashboardFaltantes";
import { cn } from "@/lib/utils";

type BarraSegmentadaTipoProps = {
  desglose: DesgloseTipo;
  className?: string;
  altura?: string;
};

export function BarraSegmentadaTipo({
  desglose,
  className,
  altura = "h-1.5",
}: BarraSegmentadaTipoProps) {
  const total = TIPOS_PROBLEMA.reduce((acc, t) => acc + desglose[t], 0);
  if (total === 0) {
    return (
      <div
        className={cn("w-full rounded-full bg-zinc-200", altura, className)}
      />
    );
  }

  return (
    <div className={cn("flex w-full gap-0.5", altura, className)}>
      {TIPOS_PROBLEMA.map((tipo) => {
        const n = desglose[tipo];
        if (n === 0) return null;
        return (
          <div
            key={tipo}
            className={cn("rounded-full", TIPO_PROBLEMA_BARRA[tipo], altura)}
            style={{ flex: n }}
            aria-hidden
          />
        );
      })}
    </div>
  );
}
