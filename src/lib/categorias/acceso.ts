import { notFound, redirect } from "next/navigation";
import { leerVista } from "@/lib/categorias/vista";
import { subtipoPermitido } from "@/lib/categorias/visibilidad";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getPerfil } from "@/lib/supabase/sesion";

/** Link directo a una subcategoría que esta persona no tiene marcada. */
export async function exigirSubtipoVisible(categoriaId: string, subtipoId: string) {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  const perfil = await getPerfil(user.id);
  const supabase = await createClient();
  const vista = await leerVista(supabase, user.id, perfil?.rol);
  if (!subtipoPermitido(vista, categoriaId, subtipoId)) notFound();
}
