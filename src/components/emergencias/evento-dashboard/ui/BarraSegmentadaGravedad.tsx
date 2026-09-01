import type { DesgloseGravedad } from "@/lib/filtracion/filtrosEvento";
import { cn } from "@/lib/utils";

const SEGMENTOS = [
  { key: "critico" as const, className: "bg-red-500" },
  { key: "medio" as const, className: "bg-amber-500" },
  { key: "bajo" as const, className: "bg-emerald-500" },
];

type BarraSegmentadaGravedadProps = {
  desglose: DesgloseGravedad;
  className?: string;
  altura?: string;
  pista?: "oscura" | "clara";
};

export function BarraSegmentadaGravedad({
  desglose,
  className,
  altura = "h-2",
  pista = "oscura",
}: BarraSegmentadaGravedadProps) {
  const total = desglose.critico + desglose.medio + desglose.bajo;
  const pistaClass = pista === "clara" ? "bg-zinc-200" : "bg-white/20";
  if (total === 0) {
    return (
      <div className={cn("w-full rounded-full", pistaClass, altura, className)} />
    );
  }

  return (
    <div className={cn("flex w-full gap-1", altura, className)}>
      {SEGMENTOS.map(({ key, className: segClass }) => {
        const n = desglose[key];
        if (n === 0) return null;
        return (
          <div
            key={key}
            className={cn("rounded-full", segClass, altura)}
            style={{ flex: n }}
            aria-hidden
          />
        );
      })}
    </div>
  );
}
