"use client";

export function BotonImprimirInforme() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-11 min-h-[44px] items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white"
    >
      Descargar PDF
    </button>
  );
}
