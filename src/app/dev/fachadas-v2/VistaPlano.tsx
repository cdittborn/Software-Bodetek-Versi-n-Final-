"use client";

import { useEffect, useState } from "react";
import { PlanoFachadas, type VariantePlano } from "@/components/fachadas/plano/PlanoFachadas";
import { ESTADOS_DEV, FICHAS_DEV } from "@/app/dev/fachadas-v2/datos";

export function VistaPlano() {
  const [variante, setVariante] = useState<VariantePlano>("movil");
  const [ampliado, setAmpliado] = useState(false);
  const [ficha, setFicha] = useState<string | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const aplicar = () => setVariante(media.matches ? "completo" : "movil");
    aplicar();
    media.addEventListener("change", aplicar);
    return () => media.removeEventListener("change", aplicar);
  }, []);

  return (
    <main className="fachadas-scope w-full min-w-0 max-w-full bg-[#f6f7f8] text-neutral-900" data-vista="plano">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <h1 className="text-lg font-semibold">Plano de fachadas</h1>
        <button
          type="button"
          data-ampliar
          aria-pressed={ampliado}
          className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white"
          style={{ minWidth: 44, minHeight: 44 }}
          onClick={() => setAmpliado((actual) => !actual)}
        >
          {ampliado ? "Reducir" : "Ampliar"}
        </button>
      </div>
      <PlanoFachadas
        modo="hoy"
        variante={variante}
        ampliado={ampliado}
        estados={ESTADOS_DEV}
        fichas={FICHAS_DEV}
        onAbrirFicha={setFicha}
      />
      {ficha ? <p className="px-4 py-3 text-sm">Ficha de prueba: {ficha}</p> : null}
      <div data-scroll-prueba className="px-4 py-8 text-sm text-neutral-500" style={{ minHeight: "80vh" }}>
        Desplazamiento de prueba del plano a tamaño completo.
      </div>
    </main>
  );
}
