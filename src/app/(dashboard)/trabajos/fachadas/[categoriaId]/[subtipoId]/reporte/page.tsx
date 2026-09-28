import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSubtipoFachadas } from "@/lib/trabajos";
import {
  cargarCatalogosFachadas,
  cargarFachadasSubtipo,
} from "@/lib/fachadas/cargar";
import { logErrorFachadas } from "@/lib/fachadas/log";
import { ReporteDirectorio } from "@/components/fachadas/ReporteDirectorio";

type PageProps = {
  params: Promise<{ categoriaId: string; subtipoId: string }>;
};

export default async function ReporteFachadasPage({ params }: PageProps) {
  const { categoriaId, subtipoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: categoria }, { data: subtipo }] = await Promise.all([
    supabase
      .from("trabajo_categorias")
      .select("id, nombre")
      .eq("id", categoriaId)
      .maybeSingle(),
    supabase
      .from("trabajo_subtipos")
      .select("id, nombre, categoria_id")
      .eq("id", subtipoId)
      .maybeSingle(),
  ]);

  if (
    !categoria ||
    !subtipo ||
    subtipo.categoria_id !== categoriaId ||
    !isSubtipoFachadas(subtipo.nombre)
  ) {
    notFound();
  }

  try {
    const catalogos = await cargarCatalogosFachadas(supabase);
    const loaded = await cargarFachadasSubtipo(supabase, catalogos.recintos);
    return (
      <main>
        <ReporteDirectorio
          categoriaId={categoriaId}
          subtipoId={subtipoId}
          fachadas={loaded.fachadas}
          intervenciones={loaded.intervenciones}
          portadas={loaded.portadas}
        />
      </main>
    );
  } catch (err) {
    logErrorFachadas("ReporteFachadasPage", err);
    return (
      <main>
        <ReporteDirectorio
          categoriaId={categoriaId}
          subtipoId={subtipoId}
          fachadas={[]}
          intervenciones={[]}
          portadas={[]}
        />
      </main>
    );
  }
}
