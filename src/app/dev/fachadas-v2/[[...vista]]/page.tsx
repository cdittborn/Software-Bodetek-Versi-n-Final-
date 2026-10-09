import { notFound } from "next/navigation";
import { VistaPlano } from "@/app/dev/fachadas-v2/VistaPlano";

type PageProps = {
  params: Promise<{ vista?: string[] }>;
};

/**
 * Plano real de Fachadas v2 con datos de prueba.
 * Solo existe con `npm run dev`. En producción responde 404.
 */
export default async function FachadasV2DevPage({ params }: PageProps) {
  if (process.env.NODE_ENV === "production") notFound();
  const { vista } = await params;
  const nombre = vista?.[0] ?? "plano";
  if (vista && vista.length > 1) notFound();
  if (nombre !== "plano") notFound();
  return <VistaPlano />;
}
