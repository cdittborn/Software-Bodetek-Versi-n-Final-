import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getPerfil } from "@/lib/supabase/sesion";
import { isSubtipoFachadas } from "@/lib/trabajos";
import { leerCategoria, leerSubtipo } from "@/lib/categorias/lectura";
import { renderFachadasSubtipo } from "./render";
import { cargarCatalogosFachadas, cargarFachadasSubtipo } from "@/lib/fachadas/cargar";

type PageProps = {
  params: Promise<{ categoriaId: string; subtipoId: string }>;
};

export default async function FachadasSubtipoPage({ params }: PageProps) {
  const { categoriaId, subtipoId } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const [categoria, subtipo, perfil, catalogos] = await Promise.all([
      leerCategoria(supabase, categoriaId),
      leerSubtipo(supabase, subtipoId),
      getPerfil(user.id),
      cargarCatalogosFachadas(supabase),
    ]);

  if (
    !categoria ||
    !subtipo ||
    subtipo.categoria_id !== categoriaId ||
    !isSubtipoFachadas(subtipo.clave)
  ) {
    notFound();
  }

  const [{ data: permiso }, loaded] = await Promise.all([
    supabase
      .from("modulo_permisos")
      .select("puede_editar")
      .eq("rol", perfil?.rol ?? "")
      .eq("modulo", "trabajos")
      .maybeSingle(),
    cargarFachadasSubtipo(supabase, catalogos.recintos),
  ]);

  return renderFachadasSubtipo({
    categoriaId,
    subtipoId,
    titulo: subtipo.nombre,
    subtitulo: categoria.nombre,
    puedeEditar: permiso?.puede_editar === true,
    catalogos,
    loaded,
  });
}
