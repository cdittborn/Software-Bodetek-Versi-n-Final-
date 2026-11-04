import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getPerfil } from "@/lib/supabase/sesion";
import { MODULOS_NAVEGABLES } from "@/lib/modulos";
import { etiquetaRol, fechaMenu } from "@/lib/menu";
import { ordenarPorOrden } from "@/lib/trabajos";
import type { CategoriaMenu } from "@/lib/categorias/editorMenu";
import { puedeEditarMenu } from "@/lib/categorias/permisos";
import { MenuLateralCliente } from "@/components/shared/menu/MenuLateralCliente";

async function cargarCategorias(userId: string, conConteos: boolean): Promise<CategoriaMenu[]> {
  const supabase = await createClient();
  const [{ data: categoriasRaw }, { data: subtiposRaw }, { data: trabajosRaw }] =
    await Promise.all([
      supabase
        .from("trabajo_categorias")
        .select("id, nombre, owner_id, orden, color, protegida")
        .eq("archivada", false),
      supabase
        .from("trabajo_subtipos")
        .select("id, nombre, categoria_id, orden, protegida"),
      conConteos
        ? supabase.from("trabajos").select("categoria_id, subtipo_id")
        : Promise.resolve({ data: [] as { categoria_id: string | null; subtipo_id: string | null }[] }),
    ]);

  const porCategoria = new Map<string, number>();
  const porSubtipo = new Map<string, number>();
  for (const t of trabajosRaw ?? []) {
    if (t.subtipo_id) porSubtipo.set(t.subtipo_id, (porSubtipo.get(t.subtipo_id) ?? 0) + 1);
    else if (t.categoria_id) {
      porCategoria.set(t.categoria_id, (porCategoria.get(t.categoria_id) ?? 0) + 1);
    }
  }

  // RLS ya filtra; respaldo explícito en UI.
  const visibles = (categoriasRaw ?? []).filter(
    (c) => c.owner_id == null || c.owner_id === userId,
  );

  return ordenarPorOrden(visibles).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    color: c.color,
    protegida: c.protegida,
    trabajos: porCategoria.get(c.id) ?? 0,
    subtipos: ordenarPorOrden((subtiposRaw ?? []).filter((s) => s.categoria_id === c.id)).map(
      (s) => ({
        id: s.id,
        nombre: s.nombre,
        protegida: s.protegida,
        trabajos: porSubtipo.get(s.id) ?? 0,
      }),
    ),
  }));
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
  const puedeEditar = permitidos.has("trabajos") && puedeEditarMenu(perfil.rol);
  const categorias = permitidos.has("trabajos")
    ? await cargarCategorias(user.id, puedeEditar)
    : [];

  return (
    <MenuLateralCliente
      fecha={fechaMenu(new Date())}
      modulos={modulos.map(({ modulo, href, label }) => ({ modulo, href, label }))}
      categorias={categorias}
      puedeEditar={puedeEditar}
      usuarioNombre={perfil.nombre ?? user.email ?? ""}
      usuarioRol={etiquetaRol(perfil.rol)}
    />
  );
}
