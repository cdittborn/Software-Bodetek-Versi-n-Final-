import { notFound } from "next/navigation";
import { VistaFichaDev } from "@/app/dev/fachadas-v2/VistaFichaDev";
import { VistaMain } from "@/app/dev/fachadas-v2/VistaMain";
import { VistaPlano } from "@/app/dev/fachadas-v2/VistaPlano";

type PageProps = {
  params: Promise<{ vista?: string[] }>;
  searchParams: Promise<{ editar?: string; id?: string }>;
};

/**
 * Componentes reales de Fachadas v2 con datos de prueba.
 * Solo existe con `npm run dev`. En producción responde 404.
 */
export default async function FachadasV2DevPage({ params, searchParams }: PageProps) {
  if (process.env.NODE_ENV === "production") notFound();
  const { vista } = await params;
  const consulta = await searchParams;
  const nombre = vista?.[0] ?? "plano";
  if (vista && vista.length > 1) notFound();
  if (nombre === "plano") return <VistaPlano />;
  if (nombre === "main") return <VistaMain puedeEditar={consulta.editar !== "0"} />;
  if (nombre === "ficha") return <VistaFichaDev id={consulta.id ?? ""} />;
  notFound();
}
