import { colorBarraCompletitud } from "@/lib/filtracion/completitud";
import { cn } from "@/lib/utils";

type BarraCompletitudProps = {
  porcentaje: number;
  className?: string;
  altura?: "fila" | "evento";
};

export function BarraCompletitud({
  porcentaje,
  className,
  altura = "fila",
}: BarraCompletitudProps) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-[#efdcde]",
        altura === "evento" ? "h-2" : "h-1.5",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300",
          colorBarraCompletitud(porcentaje),
        )}
        style={{ width: `${Math.min(100, Math.max(0, porcentaje))}%` }}
      />
    </div>
  );
}
