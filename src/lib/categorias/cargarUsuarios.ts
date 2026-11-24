import type { SupabaseClient } from "@supabase/supabase-js";
import { faltaTablaNueva } from "@/lib/categorias/columnas";
import { claveHoja, iniciales, ordenRol } from "@/lib/categorias/visibilidad";
import { colorCategoria } from "@/lib/menu";

type Cliente = SupabaseClient;

export type PersonaPantalla = {
  id: string;
  nombre: string;
  rol: string;
  iniciales: string;
  esAdmin: boolean;
  veTodo: boolean;
  accesoBloqueado: boolean;
  marcas: string[];
};

export type CategoriaPantalla = {
  id: string;
  nombre: string;
  color: string;
  tinte: string;
  subtipos: { id: string; nombre: string }[];
};

type Cat = { id: string; nombre: string; orden: number | null; color: string | null };
type Sub = { id: string; nombre: string; categoria_id: string; orden: number | null };

function porNombre<T extends { orden: number | null; nombre: string }>(filas: T[]): T[] {
  return filas.slice().sort((a, b) => {
    const d = (a.orden ?? 1000) - (b.orden ?? 1000);
    return d !== 0 ? d : a.nombre.localeCompare(b.nombre, "es");
  });
}

/** Categorías del permiso, sin las archivadas. Si la base es la de hoy, igual arma la lista. */
export async function cargarPantallaUsuarios(supabase: Cliente): Promise<{
  personas: PersonaPantalla[];
  categorias: CategoriaPantalla[];
  puedeGuardar: boolean;
}> {
  const cats = await supabase
    .from("trabajo_categorias")
    .select("id, nombre, orden, color, archivada")
    .eq("archivada", false);
  let categoriasBase: Cat[];
  if (!cats.error) {
    categoriasBase = (cats.data ?? []).map((c) => ({
      id: c.id,
      nombre: c.nombre,
      orden: c.orden,
      color: c.color,
    }));
  } else if (faltaTablaNueva(cats.error)) {
    const legado = await supabase.from("trabajo_categorias").select("id, nombre");
    if (legado.error) throw new Error(legado.error.message);
    categoriasBase = (legado.data ?? [])
      .filter((c) => c.nombre !== "Otros trabajos CD")
      .map((c) => ({ id: c.id, nombre: c.nombre, orden: null, color: null }));
  } else {
    throw new Error(cats.error.message);
  }

  const subs = await supabase.from("trabajo_subtipos").select("id, nombre, categoria_id, orden");
  let subtipos: Sub[];
  if (!subs.error) {
    subtipos = subs.data ?? [];
  } else if (faltaTablaNueva(subs.error)) {
    const legado = await supabase.from("trabajo_subtipos").select("id, nombre, categoria_id");
    if (legado.error) throw new Error(legado.error.message);
    subtipos = (legado.data ?? []).map((s) => ({ ...s, orden: null }));
  } else {
    throw new Error(subs.error.message);
  }

  const categorias: CategoriaPantalla[] = porNombre(categoriasBase).map((c, i) => {
    const tono = colorCategoria(c.color, i);
    return {
      id: c.id,
      nombre: c.nombre,
      color: tono.color,
      tinte: tono.tinte,
      subtipos: porNombre(subtipos.filter((s) => s.categoria_id === c.id)).map((s) => ({
        id: s.id,
        nombre: s.nombre,
      })),
    };
  });

  const perfiles = await supabase
    .from("perfiles")
    .select("id, nombre, rol, visibilidad_personalizada")
    .order("nombre", { ascending: true });

  let puedeGuardar = true;
  let filas: { id: string; nombre: string | null; rol: string; visibilidad_personalizada: boolean }[];
  if (!perfiles.error) {
    filas = perfiles.data ?? [];
  } else if (faltaTablaNueva(perfiles.error)) {
    puedeGuardar = false;
    const legado = await supabase.from("perfiles").select("id, nombre, rol").order("nombre", { ascending: true });
    if (legado.error) throw new Error(legado.error.message);
    filas = (legado.data ?? []).map((p) => ({ ...p, visibilidad_personalizada: false }));
  } else {
    throw new Error(perfiles.error.message);
  }

  const marcas = new Map<string, string[]>();
  if (puedeGuardar) {
    const vis = await supabase.from("usuario_visibilidad").select("usuario_id, categoria_id, subtipo_id");
    if (faltaTablaNueva(vis.error)) {
      puedeGuardar = false;
    } else if (vis.error) {
      throw new Error(vis.error.message);
    } else {
      for (const f of vis.data ?? []) {
        const lista = marcas.get(f.usuario_id) ?? [];
        lista.push(claveHoja(f.categoria_id, f.subtipo_id));
        marcas.set(f.usuario_id, lista);
      }
    }
  }

  const personas = filas
    .slice()
    .sort((a, b) => ordenRol(a.rol) - ordenRol(b.rol) || (a.nombre ?? "").localeCompare(b.nombre ?? "", "es"))
    .map((p) => {
      const esAdmin = p.rol === "admin";
      const veTodo = esAdmin || !p.visibilidad_personalizada || !puedeGuardar;
      return {
        id: p.id,
        nombre: p.nombre?.trim() || "Sin nombre",
        rol: p.rol,
        iniciales: iniciales(p.nombre),
        esAdmin,
        veTodo,
        accesoBloqueado: false,
        marcas: veTodo ? [] : (marcas.get(p.id) ?? []),
      };
    });

  return { personas, categorias, puedeGuardar };
}
