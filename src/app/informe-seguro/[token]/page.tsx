import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { InformeSeguroRuta } from "@/components/informe-seguro/InformeSeguroRuta";
import { cargarVistaPublica } from "@/lib/informe-seguro/cargarPublico";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Informe para el seguro",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function InformeSeguroPublicoPage({ params }: PageProps) {
  const { token } = await params;
  const vista = await cargarVistaPublica(token);
  if (!vista) notFound();

  return (
    <Suspense>
      <InformeSeguroRuta
        modoInicial="liquidador"
        controles={false}
        fuente={vista.fuente}
        inicial={vista.borrador}
        urls={vista.urls}
      />
    </Suspense>
  );
}
