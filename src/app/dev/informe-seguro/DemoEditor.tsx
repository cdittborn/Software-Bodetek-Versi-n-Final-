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
        dashboardHref="/dev/informe-seguro"
        tokenActivo={false}
        linkPath="/informe-seguro/demo-token-local-no-publico"
        onGuardar={async () => ({ ...sinEscritura, tokenActivo: false })}
        onActivar={async () => sinEscritura}
        onDesactivar={async () => ({ ...sinEscritura, tokenActivo: false })}
        onRegenerar={async () => sinEscritura}
      />
    </Suspense>
  );
}
