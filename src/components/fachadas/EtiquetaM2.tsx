import { formatMetrosCl, formatSuperficieEnteraCl } from "@/lib/fachadas/formato";
import { formatM2Cl, tieneSuperficieM2 } from "@/lib/fachadas/indicadores";
import { cn } from "@/lib/utils";

export function EtiquetaM2({
  m2,
  enteros = false,
  decimales,
  conUnidad = true,
  className,
}: {
  m2: number | null | undefined;
  enteros?: boolean;
  /** 2 fuerza «180,00». El dashboard de totales sigue en enteros. */
  decimales?: 2;
  conUnidad?: boolean;
  className?: string;
}) {
  if (!tieneSuperficieM2(m2)) {
    return <span className={cn("text-muted-foreground", className)}>Sin m²</span>;
  }
  const n = enteros
    ? formatSuperficieEnteraCl(m2)
    : decimales === 2
      ? formatMetrosCl(m2)
      : formatM2Cl(m2);
  return (
    <span className={className}>
      {n}
      {conUnidad ? " m²" : null}
    </span>
  );
}
