import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VistaInformeSeguro } from "@/components/informe-seguro/VistaInformeSeguro";
import { cargarVistaPublica } from "@/lib/informe-seguro/cargarPublico";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Informe para seguro",
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
    <main className="min-h-full bg-white">
      <VistaInformeSeguro snapshot={vista.snapshot} urls={vista.urls} />
    </main>
  );
}
