"use client";

import { Suspense } from "react";
import { InformeSeguroRuta } from "@/components/informe-seguro/InformeSeguroRuta";
import { borradorDemo, fuenteDemo, previewsDemo } from "@/lib/informe-seguro/demo-datos";
import type { ResultadoPersistir } from "@/lib/informe-seguro/resultado";

const sinEscritura: ResultadoPersistir = {
  ok: true,
  tokenActivo: true,
  linkPath: "/informe-seguro/demo-token-local-no-publico",
};

export function DemoEditor() {
  return (
    <Suspense>
      <InformeSeguroRuta
        controles
        fuente={fuenteDemo}
        inicial={borradorDemo}
        urls={previewsDemo}
        tokenActivo={false}
        linkPath={null}
        onGuardar={async () => sinEscritura}
        onDesactivar={async () => ({ ...sinEscritura, tokenActivo: false, linkPath: null })}
        onRegenerar={async () => sinEscritura}
      />
    </Suspense>
  );
}
