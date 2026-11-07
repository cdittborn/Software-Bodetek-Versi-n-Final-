import { createAdminClient } from "@/lib/supabase/admin";

/** Ids con el inicio de sesión bloqueado. Si la clave de servicio falla, la pantalla igual abre. */
export async function idsConAccesoBloqueado(): Promise<Set<string>> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
    if (error || !data) return new Set();
    const ahora = Date.now();
    return new Set(
      data.users
        .filter((usuario) => {
          if (!usuario.banned_until) return false;
          const hasta = Date.parse(usuario.banned_until);
          return Number.isFinite(hasta) && hasta > ahora;
        })
        .map((usuario) => usuario.id),
    );
  } catch {
    return new Set();
  }
}
