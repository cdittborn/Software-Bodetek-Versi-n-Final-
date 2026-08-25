import { cn } from "@/lib/utils";

export function EtiquetaFaltaBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded border border-[#f2c3c8] bg-[#fdeced] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[#a4131f] uppercase",
        className,
      )}
    >
      Falta
    </span>
  );
}

export function EtiquetaAtrasadaBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-amber-900 uppercase",
        className,
      )}
    >
      Atrasada
    </span>
  );
}

export function ValorOFalta({
  value,
  className,
}: {
  value?: string | null;
  className?: string;
}) {
  const texto = value?.trim();
  if (texto) return <span className={className}>{texto}</span>;
  return <EtiquetaFaltaBadge />;
}
