import type { SupabaseClient } from "@supabase/supabase-js";
import { faltaTablaNueva } from "@/lib/categorias/columnas";
import { claveHoja, VISTA_TODO, type Vista } from "@/lib/categorias/visibilidad";

type Cliente = SupabaseClient;

/**
 * Lo que esta persona puede ver. Si la tabla todavía no existe, ve todo:
 * es lo mismo que hoy y la pantalla no se cae.
 */
export async function leerVista(
  supabase: Cliente,
  userId: string,
  rol: string | null | undefined,
): Promise<Vista> {
  if (rol === "admin") return VISTA_TODO;

  const perfil = await supabase
    .from("perfiles")
    .select("visibilidad_personalizada")
    .eq("id", userId)
    .maybeSingle();
  if (faltaTablaNueva(perfil.error)) return VISTA_TODO;
  if (perfil.error) throw new Error(perfil.error.message);
  if (!perfil.data?.visibilidad_personalizada) return VISTA_TODO;

  const filas = await supabase
    .from("usuario_visibilidad")
    .select("categoria_id, subtipo_id")
    .eq("usuario_id", userId);
  if (filas.error) throw new Error(filas.error.message);

  return {
    todo: false,
    pares: new Set(
      (filas.data ?? []).map((f) => claveHoja(f.categoria_id, f.subtipo_id)),
    ),
  };
}
