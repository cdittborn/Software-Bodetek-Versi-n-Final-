import { cn } from "@/lib/utils";
import {
  labelEstadoCalculadoFachada,
  type EstadoCalculadoFachada,
} from "@/lib/fachadas/estado";

const CHIP: Record<EstadoCalculadoFachada, string> = {
  en_ejecucion: "bg-sky-100 text-sky-900",
  programada: "bg-amber-100 text-amber-900",
  al_dia: "bg-emerald-100 text-emerald-900",
  requiere_trabajo: "bg-[#c8102e]/10 text-[#c8102e]",
};

export function ChipEstadoFachada({
  estado,
}: {
  estado: EstadoCalculadoFachada;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-full px-3 text-sm font-medium",
        CHIP[estado],
      )}
    >
      {labelEstadoCalculadoFachada(estado)}
    </span>
  );
}
