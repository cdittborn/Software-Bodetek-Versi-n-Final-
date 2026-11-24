import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSubtipoFachadas } from "@/lib/trabajos";
import { leerCategoria, leerSubtipo } from "@/lib/categorias/lectura";
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

  const [categoria, subtipo] = await Promise.all([
    leerCategoria(supabase, categoriaId),
    leerSubtipo(supabase, subtipoId),
  ]);

  if (
    !categoria ||
    !subtipo ||
    subtipo.categoria_id !== categoriaId ||
    !isSubtipoFachadas(subtipo.clave)
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
