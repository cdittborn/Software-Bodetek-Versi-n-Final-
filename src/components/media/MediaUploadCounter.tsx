import { Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

type MediaUploadCounterProps = {
  actual: number;
  max?: number;
  etiqueta?: string;
  className?: string;
};

export function MediaUploadCounter({
  actual,
  max,
  etiqueta,
  className,
}: MediaUploadCounterProps) {
  const tieneArchivos = actual > 0;

  const texto = (() => {
    if (tieneArchivos) {
      const plural = actual === 1 ? "archivo" : "archivos";
      if (max != null) {
        return `${actual} ${plural} · ${actual}/${max}`;
      }
      return `${actual} ${plural}`;
    }
    if (max != null) return `0/${max}`;
    return null;
  })();

  if (!texto) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold",
        tieneArchivos
          ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
          : "font-medium text-muted-foreground",
        className,
      )}
    >
      {tieneArchivos ? (
        <Paperclip className="size-3.5 shrink-0" aria-hidden />
      ) : null}
      {etiqueta ? (
        <span className={cn(tieneArchivos ? "opacity-90" : undefined)}>
          {etiqueta}
          <span className="mx-1 opacity-60">·</span>
        </span>
      ) : null}
      {texto}
    </span>
  );
}
