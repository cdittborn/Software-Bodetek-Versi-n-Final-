"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPerfil } from "@/lib/supabase/sesion";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  usuarioId: z.string().uuid(),
  bloquear: z.boolean(),
});

export type ResultadoAcceso = { ok: true } | { ok: false; error: string };

/** Bloquea o devuelve el inicio de sesión. No borra la cuenta ni lo que subió. */
export async function cambiarAcceso(input: unknown): Promise<ResultadoAcceso> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const perfil = await getPerfil(user.id);
  if (perfil?.rol !== "admin") {
    return { ok: false, error: "Solo el Gerente General puede cambiar el acceso." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Los datos no son válidos." };
  if (parsed.data.usuarioId === user.id) {
    return { ok: false, error: "No puedes quitarte el acceso a ti mismo." };
  }

  const { data: destino } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", parsed.data.usuarioId)
    .maybeSingle();
  if (!destino) return { ok: false, error: "Esa persona no existe." };
  if (destino.rol === "admin") {
    return { ok: false, error: "No se le quita el acceso al Gerente General." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(parsed.data.usuarioId, {
    ban_duration: parsed.data.bloquear ? "876000h" : "none",
  });
  if (error) return { ok: false, error: error.message || "No se pudo cambiar el acceso." };

  refresh();
  return { ok: true };
}
