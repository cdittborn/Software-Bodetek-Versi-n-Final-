import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getPerfil } from "@/lib/supabase/sesion";
import { MODULOS_NAVEGABLES } from "@/lib/modulos";
import { etiquetaRol, fechaMenu } from "@/lib/menu";
import { sortCategoriasConOtrosAlFinal, type CategoriaNav } from "@/lib/trabajos";
import { MenuLateralCliente } from "@/components/shared/menu/MenuLateralCliente";

async function cargarCategorias(userId: string): Promise<CategoriaNav[]> {
  const supabase = await createClient();
  const [{ data: categoriasRaw }, { data: subtiposRaw }] = await Promise.all([
    supabase
      .from("trabajo_categorias")
      .select("id, nombre, owner_id")
      .order("nombre", { ascending: true }),
    supabase
      .from("trabajo_subtipos")
      .select("id, nombre, categoria_id")
      .order("nombre", { ascending: true }),
  ]);

  // RLS ya filtra; respaldo explícito en UI.
  const visibles = (categoriasRaw ?? []).filter((c) => {
    const ownerId = "owner_id" in c ? (c.owner_id as string | null) : null;
    return ownerId == null || ownerId === userId;
  });

  return sortCategoriasConOtrosAlFinal(
    visibles.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      subtipos: (subtiposRaw ?? []).filter((s) => s.categoria_id === c.id),
    })),
  );
}

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
  const modulos = MODULOS_NAVEGABLES.filter((m) => permitidos.has(m.modulo));
  const categorias = permitidos.has("trabajos") ? await cargarCategorias(user.id) : [];

  return (
    <MenuLateralCliente
      fecha={fechaMenu(new Date())}
      modulos={modulos.map(({ modulo, href, label }) => ({ modulo, href, label }))}
      categorias={categorias}
      usuarioNombre={perfil.nombre ?? user.email ?? ""}
      usuarioRol={etiquetaRol(perfil.rol)}
    />
  );
}
