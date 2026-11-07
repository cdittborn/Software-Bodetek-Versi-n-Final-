"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getPerfil } from "@/lib/supabase/sesion";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  usuarioId: z.string().uuid(),
  todo: z.boolean(),
  items: z
    .array(
      z.object({
        categoria_id: z.string().uuid(),
        subtipo_id: z.string().uuid().nullable(),
      }),
    )
    .max(500),
});

export type ResultadoVisibilidad = { ok: true } | { ok: false; error: string };

/** Guarda lo que una persona puede ver. La base vuelve a exigir que sea admin. */
export async function guardarVisibilidad(input: unknown): Promise<ResultadoVisibilidad> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const perfil = await getPerfil(user.id);
  if (perfil?.rol !== "admin") {
    return { ok: false, error: "Solo el Gerente General puede cambiar lo que ve cada persona." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Los datos no son válidos." };

  const { error } = await supabase.rpc("guardar_visibilidad_usuario", {
    p_usuario: parsed.data.usuarioId,
    p_todo: parsed.data.todo,
    p_items: parsed.data.items,
  });
  if (error) {
    const mensaje = error.message ?? "";
    if (
      error.code === "PGRST202" ||
      error.code === "42883" ||
      /guardar_visibilidad_usuario/i.test(mensaje) ||
      /schema cache/i.test(mensaje)
    ) {
      return {
        ok: false,
        error: "Todavía no se puede guardar: la base no tiene esta función. No se cambió nada.",
      };
    }
    return { ok: false, error: mensaje || "No se pudo guardar." };
  }

  refresh();
  return { ok: true };
}
