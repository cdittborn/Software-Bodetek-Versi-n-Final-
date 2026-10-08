"use client";

import { XIcon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { estiloEstado, type EstadoPlano } from "@/lib/fachadas/plano";

export type HojaFachadaDatos = {
  id: string;
  nombre: string;
  ubicacion: "interior" | "exterior";
  hacia: string;
  estado: EstadoPlano;
  superficieM2: number | null;
  ultimaIntervencion: string | null;
};

function textoSuperficie(valor: number | null): string {
  if (valor == null) return "Sin m²";
  const numero = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(valor);
  return `${numero} m²`;
}

export function HojaFachada({
  fachada,
  onCerrar,
  onAbrirFicha,
}: {
  fachada: HojaFachadaDatos | null;
  onCerrar: () => void;
  onAbrirFicha?: (svgId: string) => void;
}) {
  const estilo = estiloEstado(fachada?.estado ?? "sin_evaluar");
  const ubicacion = fachada?.ubicacion === "exterior" ? "Exterior" : "Interior";
  return (
    <Dialog
      open={fachada != null}
      onOpenChange={(abierta) => {
        if (!abierta) onCerrar();
      }}
    >
      <DialogContent
        showCloseButton={false}
        finalFocus={false}
        role="dialog"
        data-fachada={fachada?.id}
        className="fd-hoja-fachada"
      >
        {fachada ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <DialogHeader className="min-w-0">
                <DialogTitle className="text-left text-base leading-snug">{fachada.nombre}</DialogTitle>
                <DialogDescription className="text-left">
                  {`${ubicacion} · hacia ${fachada.hacia} · ${textoSuperficie(fachada.superficieM2)}`}
                </DialogDescription>
              </DialogHeader>
              <DialogClose
                aria-label="Cerrar"
                className="inline-flex shrink-0 items-center justify-center rounded-md border border-neutral-200"
                style={{ width: 44, height: 44 }}
              >
                <XIcon aria-hidden="true" />
              </DialogClose>
            </div>
            <span
              className="inline-flex w-fit items-center rounded-full px-2 py-1 text-xs font-medium"
              style={{ background: estilo.badgeBg, color: estilo.badgeTexto }}
            >
              {estilo.etiqueta}
            </span>
            <p className="text-sm text-neutral-700">
              {fachada.ultimaIntervencion
                ? `Última intervención: ${fachada.ultimaIntervencion}`
                : "Sin intervenciones"}
            </p>
            <button
              type="button"
              className="w-full rounded-md bg-neutral-900 text-sm font-medium text-white"
              style={{ height: 48, minHeight: 48 }}
              onClick={() => onAbrirFicha?.(fachada.id)}
            >
              Abrir ficha
            </button>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
