"use client";

import { X } from "lucide-react";
import type { FiltroCampoToken } from "@/lib/filtracion/filtrosCampoEvento";
import { cn } from "@/lib/utils";

type TokenFiltroCampoProps = {
  token: FiltroCampoToken;
  onRemove: () => void;
};

export function TokenFiltroCampo({ token, onRemove }: TokenFiltroCampoProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-[44px] max-w-full items-center gap-1.5 rounded-full border border-[#f2c3c8] bg-[#fdeced] px-3 py-1.5 text-xs text-[#a4131f]",
      )}
    >
      <span className="font-semibold uppercase tracking-wide">
        {token.labelCampo}
      </span>
      <span className="truncate">{token.labelValor}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 flex size-6 shrink-0 items-center justify-center rounded-full hover:bg-[#f2c3c8]/50"
        aria-label={`Quitar filtro ${token.labelCampo} ${token.labelValor}`}
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
}
