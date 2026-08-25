"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EtiquetaAtrasadaBadge } from "@/components/emergencias/evento-consolidado/ui/EtiquetaFaltaBadge";
import {
  GRAVEDAD_LLUVIAS_LABEL,
  formatFechaCl,
  isGravedadLluvias,
} from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type FiltracionFormHeaderProps = {
  isEdit: boolean;
  codigoFiltracion: string | null;
  gravedad: string | null;
  recintoLabel: string;
  arrendatario: string | null;
  fechaReporte: string;
  autorNombre: string | null;
  onClose: () => void;
  onCancelMobile?: () => void;
  onSaveMobile?: () => void;
  saving?: boolean;
  atrasada?: boolean;
};

export function FiltracionFormHeader({
  isEdit,
  codigoFiltracion,
  gravedad,
  recintoLabel,
  arrendatario,
  fechaReporte,
  autorNombre,
  onClose,
  onCancelMobile,
  onSaveMobile,
  saving = false,
  atrasada = false,
}: FiltracionFormHeaderProps) {
  const titulo = isEdit ? "Editar filtración" : "Nueva filtración";
  const gravedadLabel =
    gravedad && isGravedadLluvias(gravedad)
      ? GRAVEDAD_LLUVIAS_LABEL[gravedad]
      : null;

  return (
    <header className="shrink-0 border-b border-[#e4e4e7] bg-white px-4 py-4 md:px-6">
      {/* Mobile action bar */}
      <div className="mb-3 flex items-center justify-between md:hidden">
        <button
          type="button"
          className="min-h-[44px] min-w-[44px] px-1 text-sm font-medium text-[#c8102e]"
          onClick={onCancelMobile ?? onClose}
        >
          Cancelar
        </button>
        <span className="text-sm font-semibold text-[#18181b]">{titulo}</span>
        <button
          type="button"
          className="min-h-[44px] min-w-[44px] px-1 text-sm font-bold text-[#c8102e] disabled:opacity-50"
          onClick={onSaveMobile}
          disabled={!onSaveMobile || saving}
        >
          {saving ? "…" : "Guardar"}
        </button>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="hidden flex-wrap items-center gap-2 md:flex">
            <h2 className="text-xl font-bold text-[#18181b]">{titulo}</h2>
            {codigoFiltracion ? (
              <span className="rounded-md border border-[#e4e4e7] bg-[#f4f4f5] px-2 py-0.5 font-mono text-xs text-[#3f3f46]">
                {codigoFiltracion}
              </span>
            ) : null}
            {gravedadLabel ? (
              <span className="rounded-md bg-[#fdeced] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#a4131f] uppercase">
                {gravedadLabel}
              </span>
            ) : null}
            {atrasada ? <EtiquetaAtrasadaBadge /> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 md:hidden">
            {codigoFiltracion ? (
              <span className="rounded-md border border-[#e4e4e7] bg-[#f4f4f5] px-2 py-0.5 font-mono text-xs text-[#3f3f46]">
                {codigoFiltracion}
              </span>
            ) : null}
            {gravedadLabel ? (
              <span className="rounded-md bg-[#fdeced] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#a4131f] uppercase">
                {gravedadLabel}
              </span>
            ) : null}
            {atrasada ? <EtiquetaAtrasadaBadge /> : null}
          </div>

          <p className="mt-1 text-[13px] text-[#71717a]">
            {recintoLabel}
            {arrendatario?.trim() ? ` · ${arrendatario.trim()}` : ""}
            {isEdit ? (
              <>
                {" · reportado el "}
                {formatFechaCl(fechaReporte)}
                {autorNombre?.trim() ? ` por ${autorNombre.trim()}` : ""}
              </>
            ) : null}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="hidden shrink-0 text-[#71717a] md:inline-flex"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </Button>
      </div>
    </header>
  );
}

export function EtiquetaFalta({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <span className="ml-2 text-[10px] font-semibold text-[#a4131f] uppercase">
      Falta
    </span>
  );
}

export function TituloSeccion({
  numero,
  titulo,
  className,
}: {
  numero: string;
  titulo: string;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "mb-4 text-base font-semibold text-[#18181b]",
        className,
      )}
    >
      <span className="mr-2 font-mono text-sm text-[#8a8a92]">{numero}</span>
      {titulo}
    </h3>
  );
}
