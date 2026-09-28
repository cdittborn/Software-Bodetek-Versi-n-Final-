import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getPerfil } from "@/lib/supabase/sesion";
import { isSubtipoFachadas } from "@/lib/trabajos";
import { renderFachadasSubtipo } from "./render";

type PageProps = {
  params: Promise<{ categoriaId: string; subtipoId: string }>;
};

export default async function FachadasSubtipoPage({ params }: PageProps) {
  const { categoriaId, subtipoId } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const [{ data: categoria }, { data: subtipo }, perfil] =
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

  return renderFachadasSubtipo({
    supabase,
    categoriaId,
    subtipoId,
    titulo: subtipo.nombre,
    subtitulo: categoria.nombre,
    puedeEditar: permiso?.puede_editar === true,
  });
}
