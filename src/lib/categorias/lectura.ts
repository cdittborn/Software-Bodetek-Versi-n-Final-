import type { SupabaseClient } from "@supabase/supabase-js";
import { ordenarPorOrden } from "@/lib/trabajos";
import type { CategoriaMenu } from "@/lib/categorias/editorMenu";
import {
  claveLegacyCategoria,
  claveLegacySubtipo,
  faltaColumnaNueva,
  ordenMenuLegacy,
} from "@/lib/categorias/columnas";
import { filtrarMenuPorVista } from "@/lib/categorias/visibilidad";
import { leerVista } from "@/lib/categorias/vista";

type Cliente = SupabaseClient;

export type FilaCategoria = { id: string; nombre: string; clave: string | null };
export type FilaSubtipo = FilaCategoria & { categoria_id: string };

/** Lee la categoría. Si `clave` todavía no existe, la deduce del nombre actual. */
export async function leerCategoria(supabase: Cliente, id: string): Promise<FilaCategoria | null> {
  const conClave = await supabase
    .from("trabajo_categorias")
    .select("id, nombre, clave")
    .eq("id", id)
    .maybeSingle();
  if (!conClave.error) {
    if (!conClave.data) return null;
    return { id: conClave.data.id, nombre: conClave.data.nombre, clave: conClave.data.clave };
  }
  if (!faltaColumnaNueva(conClave.error)) return null;

  const sinClave = await supabase
    .from("trabajo_categorias")
    .select("id, nombre")
    .eq("id", id)
    .maybeSingle();
  if (!sinClave.data) return null;
  return {
    id: sinClave.data.id,
    nombre: sinClave.data.nombre,
    clave: claveLegacyCategoria(sinClave.data.nombre),
  };
}

/** Lee la subcategoría. Misma reserva que `leerCategoria` si falta `clave`. */
export async function leerSubtipo(supabase: Cliente, id: string): Promise<FilaSubtipo | null> {
  const conClave = await supabase
    .from("trabajo_subtipos")
    .select("id, nombre, clave, categoria_id")
    .eq("id", id)
    .maybeSingle();
  if (!conClave.error) {
    if (!conClave.data) return null;
    return {
      id: conClave.data.id,
      nombre: conClave.data.nombre,
      clave: conClave.data.clave,
      categoria_id: conClave.data.categoria_id,
    };
  }
  if (!faltaColumnaNueva(conClave.error)) return null;

  const sinClave = await supabase
    .from("trabajo_subtipos")
    .select("id, nombre, categoria_id")
    .eq("id", id)
    .maybeSingle();
  if (!sinClave.data) return null;
  return {
    id: sinClave.data.id,
    nombre: sinClave.data.nombre,
    clave: claveLegacySubtipo(sinClave.data.nombre),
    categoria_id: sinClave.data.categoria_id,
  };
}

/**
 * Categorías del menú. Si las columnas de la fase 2 no existen, devuelve el
 * menú de hoy (orden por nombre, sin lápiz) y no toca la base de otra forma.
 */
export async function leerMenu(
  supabase: Cliente,
  userId: string,
  conConteos: boolean,
  rol?: string | null,
): Promise<{ categorias: CategoriaMenu[]; columnasNuevas: boolean }> {
  const [cats, subs] = await Promise.all([
    supabase
      .from("trabajo_categorias")
      .select("id, nombre, owner_id, orden, color, protegida")
      .eq("archivada", false),
    supabase.from("trabajo_subtipos").select("id, nombre, categoria_id, orden, protegida"),
  ]);

  if (faltaColumnaNueva(cats.error) || faltaColumnaNueva(subs.error)) {
    return {
      columnasNuevas: false,
      categorias: filtrarMenuPorVista(await menuDeHoy(supabase, userId), await leerVista(supabase, userId, rol)),
    };
  }
  if (cats.error) throw new Error(cats.error.message);
  if (subs.error) throw new Error(subs.error.message);

  const trabajos = conConteos
    ? (await supabase.from("trabajos").select("categoria_id, subtipo_id")).data ?? []
    : [];
  const porCategoria = new Map<string, number>();
  const porSubtipo = new Map<string, number>();
  for (const t of trabajos) {
    if (t.subtipo_id) porSubtipo.set(t.subtipo_id, (porSubtipo.get(t.subtipo_id) ?? 0) + 1);
    else if (t.categoria_id) porCategoria.set(t.categoria_id, (porCategoria.get(t.categoria_id) ?? 0) + 1);
  }

  const visibles = (cats.data ?? []).filter((c) => c.owner_id == null || c.owner_id === userId);
  const subtipos = subs.data ?? [];

  return {
    columnasNuevas: true,
    categorias: filtrarMenuPorVista(
      ordenarPorOrden(visibles).map((c) => ({
        id: c.id,
        nombre: c.nombre,
        color: c.color,
        protegida: c.protegida,
        trabajos: porCategoria.get(c.id) ?? 0,
        subtipos: ordenarPorOrden(subtipos.filter((s) => s.categoria_id === c.id)).map((s) => ({
          id: s.id,
          nombre: s.nombre,
          protegida: s.protegida,
          trabajos: porSubtipo.get(s.id) ?? 0,
        })),
      })),
      await leerVista(supabase, userId, rol),
    ),
  };
}

async function menuDeHoy(supabase: Cliente, userId: string): Promise<CategoriaMenu[]> {
  const [cats, subs] = await Promise.all([
    supabase.from("trabajo_categorias").select("id, nombre, owner_id"),
    supabase.from("trabajo_subtipos").select("id, nombre, categoria_id"),
  ]);
  if (cats.error) throw new Error(cats.error.message);
  if (subs.error) throw new Error(subs.error.message);

  const visibles = (cats.data ?? []).filter((c) => c.owner_id == null || c.owner_id === userId);
  const subtipos = subs.data ?? [];

  return ordenMenuLegacy(visibles).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    color: null,
    protegida: false,
    trabajos: 0,
    subtipos: (subtipos ?? [])
      .filter((s) => s.categoria_id === c.id)
      .slice()
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
      .map((s) => ({ id: s.id, nombre: s.nombre, protegida: false, trabajos: 0 })),
  }));
}
