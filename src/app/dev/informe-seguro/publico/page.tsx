import { Suspense } from "react";
import { notFound } from "next/navigation";
import { InformeSeguroRuta } from "@/components/informe-seguro/InformeSeguroRuta";
import { borradorDemo, fuenteDemo, previewsDemo } from "@/lib/informe-seguro/demo-datos";
import { armarVistaLiquidador } from "@/lib/informe-seguro/vista";

export const dynamic = "force-dynamic";

export default function DemoPublicoInformePage() {
  if (process.env.NODE_ENV === "production") notFound();
  const vista = armarVistaLiquidador(fuenteDemo, borradorDemo);

  return (
    <Suspense>
      <InformeSeguroRuta
        modoInicial="liquidador"
        controles={false}
        fuente={vista.fuente}
        inicial={vista.borrador}
        urls={previewsDemo}
      />
    </Suspense>
  );
}
