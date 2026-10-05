import { notFound } from "next/navigation";
import { DemoDashboard } from "@/components/fachadas/demo/DemoDashboard";
import { DemoFicha } from "@/components/fachadas/demo/DemoFicha";
import { DemoIntervencion } from "@/components/fachadas/demo/DemoIntervencion";
import { DemoNuevaFachada } from "@/components/fachadas/demo/DemoNuevaFachada";

type PageProps = {
  params: Promise<{ vista?: string[] }>;
};

/**
 * Capturas locales de Fachadas. Solo existe con `npm run dev`.
 * En producción (y en el preview de Vercel) responde 404.
 * No abre sesión ni toca el login de /trabajos/fachadas/demo.
 */
export default async function FachadasMobileDevPage({ params }: PageProps) {
  if (process.env.NODE_ENV === "production") notFound();
  const { vista } = await params;
  const nombre = vista?.[0] ?? "dashboard";
  if (vista && vista.length > 1) notFound();
  if (nombre === "ficha") return <DemoFicha />;
  if (nombre === "intervencion") return <DemoIntervencion />;
  if (nombre === "nueva") return <DemoNuevaFachada />;
  if (nombre !== "dashboard") notFound();
  return <DemoDashboard />;
}
