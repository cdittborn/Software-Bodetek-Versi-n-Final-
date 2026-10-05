import { notFound } from "next/navigation";
import { VistaInformeSeguro } from "@/components/informe-seguro/VistaInformeSeguro";
import { previewsDemo, snapshotDemo } from "@/lib/informe-seguro/demo-datos";

export const dynamic = "force-dynamic";

export default function DemoPublicoInformePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="min-h-full bg-white">
      <VistaInformeSeguro snapshot={snapshotDemo} urls={previewsDemo} />
    </main>
  );
}
