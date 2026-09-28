import { cn } from "@/lib/utils";
import {
  labelEstadoCalculadoFachada,
  type EstadoCalculadoFachada,
} from "@/lib/fachadas/estado";
import { COLOR_ESTADO_CALC } from "@/lib/fachadas/ui";

export function ChipEstadoFachada({
  estado,
  className,
}: {
  estado: EstadoCalculadoFachada;
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
      {labelEstadoCalculadoFachada(estado)}
    </span>
  );
}
