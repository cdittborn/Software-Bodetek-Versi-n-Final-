import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DetalleFachadaVista } from "@/components/fachadas/DetalleFachadaVista";
import {
  cargarCatalogosFachadas,
  cargarConteosBorrarFachada,
  cargarFachadaDetalle,
} from "@/lib/fachadas/cargar";
import { isSubtipoFachadas } from "@/lib/trabajos";

type PageProps = {
  params: Promise<{ categoriaId: string; subtipoId: string; fachadaId: string }>;
};

export default async function FachadaPage({ params }: PageProps) {
  const { categoriaId, subtipoId, fachadaId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: categoria }, { data: subtipo }, { data: perfil }] = await Promise.all([
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
    supabase.from("perfiles").select("rol").eq("id", user.id).maybeSingle(),
  ]);

  if (
    !categoria ||
    !subtipo ||
    subtipo.categoria_id !== categoriaId ||
    !isSubtipoFachadas(subtipo.nombre)
  ) {
    notFound();
  }

  const { data: permiso } = await supabase
    .from("modulo_permisos")
    .select("puede_editar")
    .eq("rol", perfil?.rol ?? "")
    .eq("modulo", "trabajos")
    .maybeSingle();

  const puedeEditar = permiso?.puede_editar === true;
  const puedeBorrar = perfil?.rol === "admin" || perfil?.rol === "pablo";

  const catalogos = await cargarCatalogosFachadas(supabase);
  const { fachada, error, tablasAusentes } = await cargarFachadaDetalle(
    supabase,
    fachadaId,
    catalogos.recintos,
  );

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

  const conteos = await cargarConteosBorrarFachada(supabase, fachadaId);

  return (
    <main>
      <DetalleFachadaVista
        categoriaId={categoriaId}
        subtipoId={subtipoId}
        fachada={fachada}
        recintos={catalogos.recintos}
        puedeEditar={puedeEditar}
        puedeBorrar={puedeBorrar}
        conteos={conteos}
      />
    </main>
  );
}
