import { Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  const mb = n / (1024 * 1024);
  return mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
}

type MediaUploadCounterProps = {
  actual: number;
  max?: number;
  etiqueta?: string;
  /** Peso conocido (p. ej. archivos pendientes). No hay size en media ya subida. */
  bytes?: number;
  className?: string;
};

export function MediaUploadCounter({
  actual,
  max,
  etiqueta,
  bytes,
  className,
}: MediaUploadCounterProps) {
  const tieneArchivos = actual > 0;

  const texto = (() => {
    const plural = actual === 1 ? "archivo" : "archivos";
    const peso =
      bytes != null && bytes > 0 ? ` · ${formatBytes(bytes)} pendientes` : "";
    if (tieneArchivos) {
      if (max != null) {
        return `${actual} ${plural} · ${actual}/${max}${peso}`;
      }
      return `${actual} ${plural}${peso}`;
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
