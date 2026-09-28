import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getPerfil } from "@/lib/supabase/sesion";
import { DetalleFachadaVista } from "@/components/fachadas/DetalleFachadaVista";
import {
  cargarCatalogosFachadas,
  cargarFichaFachada,
} from "@/lib/fachadas/cargar";
import { logErrorFachadas } from "@/lib/fachadas/log";
import { isSubtipoFachadas } from "@/lib/trabajos";

type PageProps = {
  params: Promise<{ categoriaId: string; subtipoId: string; fachadaId: string }>;
};

export default async function FachadaPage({ params }: PageProps) {
  const { categoriaId, subtipoId, fachadaId } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const [{ data: categoria }, { data: subtipo }, perfil, catalogos] =
    await Promise.all([
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
      getPerfil(user.id),
      cargarCatalogosFachadas(supabase),
    ]);

  if (
    !categoria ||
    !subtipo ||
    subtipo.categoria_id !== categoriaId ||
    !isSubtipoFachadas(subtipo.nombre)
  ) {
    notFound();
  }

  const puedeBorrar = perfil?.rol === "admin" || perfil?.rol === "pablo";

  try {
    const [{ data: permiso }, ficha] = await Promise.all([
      supabase
        .from("modulo_permisos")
        .select("puede_editar")
        .eq("rol", perfil?.rol ?? "")
        .eq("modulo", "trabajos")
        .maybeSingle(),
      cargarFichaFachada(supabase, fachadaId, catalogos.recintos),
    ]);
    const puedeEditar = permiso?.puede_editar === true;
    const { fachada, intervenciones, error, tablasAusentes } = ficha;

    if (tablasAusentes) {
      return (
        <main className="mx-auto w-full max-w-5xl px-4 py-10">
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            El módulo Fachadas aún no está habilitado en la base de datos. Hay que
            aplicar la migración (solo aditiva) antes de ver esta ficha.
          </p>
        </main>
      );
    }

    if (!fachada) {
      if (error) {
        return (
          <main className="mx-auto w-full max-w-5xl px-4 py-10">
            <p className="text-sm text-destructive">{error}</p>
          </main>
        );
      }
      notFound();
    }

    const conteos = {
      intervenciones: intervenciones.length,
      cotizaciones: intervenciones.reduce((n, i) => n + i.cotizaciones.length, 0),
      fotos: intervenciones.reduce((n, i) => n + i.media.length, 0),
    };

    return (
      <main>
        <DetalleFachadaVista
          categoriaId={categoriaId}
          subtipoId={subtipoId}
          fachada={fachada}
          intervenciones={intervenciones}
          recintos={catalogos.recintos}
          proveedores={catalogos.proveedores}
          puedeEditar={puedeEditar}
          puedeBorrar={puedeBorrar}
          conteos={conteos}
        />
      </main>
    );
  } catch (err) {
    logErrorFachadas("FachadaPage", err);
    const message =
      err instanceof Error ? err.message : "No se pudo cargar la ficha.";
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
          {message}
        </p>
      </main>
    );
  }
}
