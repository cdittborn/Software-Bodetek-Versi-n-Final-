"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getPerfil } from "@/lib/supabase/sesion";
import { createClient } from "@/lib/supabase/server";
import { PALETA_CATEGORIAS } from "@/lib/menu";
import { NOMBRE_MAXIMO } from "@/lib/categorias/editorMenu";
import { puedeEditarMenu } from "@/lib/categorias/permisos";

const id = z.string().uuid().nullable();
const nombre = z.string().trim().min(1).max(NOMBRE_MAXIMO);
const colores = PALETA_CATEGORIAS.map((p) => p.color) as [string, ...string[]];

const payloadSchema = z.object({
  categorias: z
    .array(
      z.object({
        id,
        nombre,
        color: z.enum(colores),
        subtipos: z.array(z.object({ id, nombre })).max(200),
      }),
    )
    .max(100),
  eliminar_subtipos: z.array(z.string().uuid()).max(500),
  eliminar_categorias: z.array(z.string().uuid()).max(100),
});

export type ResultadoMenu = { ok: true } | { ok: false; error: string };

/** Guarda todo el menú en un paso. La base vuelve a validar permisos y borrados. */
export async function guardarMenu(input: unknown): Promise<ResultadoMenu> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };
  const perfil = await getPerfil(user.id);
  if (!puedeEditarMenu(perfil?.rol)) {
    return { ok: false, error: "Solo admin y Pablo pueden editar el menú." };
  }

  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Los datos del menú no son válidos." };

  const { error } = await supabase.rpc("guardar_menu_categorias", { p: parsed.data });
  if (error) return { ok: false, error: error.message || "No se pudo guardar el menú." };

  refresh();
  return { ok: true };
}
