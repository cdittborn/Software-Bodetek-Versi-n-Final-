import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getPerfil } from "@/lib/supabase/sesion";
import { MODULOS_NAVEGABLES } from "@/lib/modulos";
import { etiquetaRol, fechaMenu } from "@/lib/menu";
import { leerMenu } from "@/lib/categorias/lectura";
import { puedeEditarMenu } from "@/lib/categorias/permisos";
import { MenuLateralCliente } from "@/components/shared/menu/MenuLateralCliente";

export async function MenuLateral() {
  const user = await getAuthUser();
  if (!user) return null;

  const perfil = await getPerfil(user.id);
  if (!perfil?.rol) return null;

  const supabase = await createClient();
  const { data: permisos } = await supabase
    .from("modulo_permisos")
    .select("modulo, puede_ver")
    .eq("rol", perfil.rol)
    .eq("puede_ver", true);

  const permitidos = new Set((permisos ?? []).map((p) => p.modulo as string));
  const modulos = MODULOS_NAVEGABLES.filter((m) => permitidos.has(m.modulo)).filter(
    (m) => m.modulo !== "usuarios" || perfil.rol === "admin",
  );
  const veTrabajos = permitidos.has("trabajos");
  const menu = veTrabajos
    ? await leerMenu(supabase, user.id, puedeEditarMenu(perfil.rol), perfil.rol)
    : { categorias: [], columnasNuevas: false };

  return (
    <MenuLateralCliente
      fecha={fechaMenu(new Date())}
      modulos={modulos.map(({ modulo, href, label }) => ({ modulo, href, label }))}
      categorias={menu.categorias}
      puedeEditar={veTrabajos && puedeEditarMenu(perfil.rol) && menu.columnasNuevas}
      usuarioNombre={perfil.nombre ?? user.email ?? ""}
      usuarioRol={etiquetaRol(perfil.rol)}
    />
  );
}
