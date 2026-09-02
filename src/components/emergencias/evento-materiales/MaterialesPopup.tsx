"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFechaCl, formatMontoClp } from "@/lib/trabajos";
import type { CompraMaterial } from "@/lib/filtracion/materiales";

export type MaterialesPopupItem = {
  key: string;
  compra: CompraMaterial;
  neto: number;
  iva: number;
  bruto: number;
};

export type MaterialesPopupAbierto = {
  titulo: string;
  categoria: string;
  items: MaterialesPopupItem[];
};

type MaterialesPopupProps = {
  popup: MaterialesPopupAbierto;
  onCerrar: () => void;
};

export function MaterialesPopup({ popup, onCerrar }: MaterialesPopupProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div
        aria-hidden
        className="absolute inset-0 bg-[#18181b]/45"
        onClick={onCerrar}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="materiales-popup-titulo"
        tabIndex={-1}
        className="relative z-10 flex max-h-[78vh] w-full max-w-[620px] flex-col overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/10 focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <h2
              id="materiales-popup-titulo"
              className="text-base font-semibold leading-snug"
            >
              {popup.titulo}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {popup.categoria} · {popup.items.length}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 min-h-[44px] min-w-[44px] shrink-0"
            onClick={onCerrar}
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {popup.items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Este proyecto-filtración no tiene compras asociadas.
            </p>
          ) : (
            <ol className="flex flex-col">
              {popup.items.map((item, i) => (
                <li
                  key={item.key}
                  className="flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-zinc-50"
                >
                  <span className="w-7 shrink-0 pt-0.5 font-mono text-xs tabular-nums text-zinc-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.compra.material}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.compra.proveedor} · {formatFechaCl(item.compra.fechaCompra)}
                    </p>
                    <p className="mt-1 text-xs tabular-nums text-zinc-600">
                      {formatMontoClp(item.neto)} neto · {formatMontoClp(item.iva)} IVA ·{" "}
                      {formatMontoClp(item.bruto)} bruto
                      {item.compra.trabajoIds.length > 1
                        ? " (parte igual)"
                        : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t px-4 py-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 min-h-[44px]"
            onClick={onCerrar}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
