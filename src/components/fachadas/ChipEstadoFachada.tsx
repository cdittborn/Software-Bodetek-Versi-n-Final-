import { cn } from "@/lib/utils";
import { estiloEstado, type EstadoPlano } from "@/lib/fachadas/plano";
import { COLOR_ESTADO_CALC } from "@/lib/fachadas/ui";

export function ChipEstadoFachada({
  estado,
  className,
}: {
  estado: EstadoPlano;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold",
        COLOR_ESTADO_CALC[estado],
        className,
      )}
    >
      {estiloEstado(estado).etiqueta}
    </span>
  );
}
