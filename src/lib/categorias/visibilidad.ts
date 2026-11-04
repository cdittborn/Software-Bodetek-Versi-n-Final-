/** Qué ve una persona. `todo` es el valor del primer día: no hay recorte. */
export type Vista = { todo: true; pares: ReadonlySet<string> } | { todo: false; pares: ReadonlySet<string> };

export const VISTA_TODO: Vista = { todo: true, pares: new Set() };

const ORDEN_ROL = ["admin", "pablo", "asistente", "socio", "cliente"];

export function claveHoja(categoriaId: string, subtipoId: string | null): string {
  return `${categoriaId}:${subtipoId ?? ""}`;
}

export function hojasDe(categorias: readonly { id: string; subtipos: readonly { id: string }[] }[]): string[] {
  return categorias.flatMap((c) =>
    c.subtipos.length > 0 ? c.subtipos.map((s) => claveHoja(c.id, s.id)) : [claveHoja(c.id, null)],
  );
}

export function iniciales(nombre: string | null | undefined): string {
  const partes = (nombre ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primera = partes[0] ?? "";
  if (partes.length === 1) return primera.slice(0, 1).toUpperCase();
  return `${primera[0] ?? ""}${partes[1]?.[0] ?? ""}`.toUpperCase();
}

export function ordenRol(rol: string): number {
  const i = ORDEN_ROL.indexOf(rol);
  return i === -1 ? ORDEN_ROL.length : i;
}

export function resumenVisibilidad(marcadas: number, total: number, esAdmin: boolean): string {
  if (esAdmin || marcadas === total) return "ve todo";
  return `ve ${marcadas} de ${total}`;
}

export function contarMarcadas(claves: readonly string[], validas: readonly string[]): number {
  const set = new Set(claves);
  return validas.filter((k) => set.has(k)).length;
}

export type EstadoCasilla = "on" | "mid" | "off";

export function estadoGrupo(grupo: readonly string[], claves: readonly string[]): EstadoCasilla {
  const set = new Set(claves);
  const n = grupo.filter((k) => set.has(k)).length;
  if (n === 0) return "off";
  if (grupo.length > 0 && n === grupo.length) return "on";
  return "mid";
}

export function alternarHoja(claves: readonly string[], hoja: string): string[] {
  const set = new Set(claves);
  if (set.has(hoja)) set.delete(hoja);
  else set.add(hoja);
  return [...set];
}

/** Si el grupo está completo, lo apaga. Si falta alguna, deja todas prendidas. */
export function alternarGrupo(claves: readonly string[], grupo: readonly string[]): string[] {
  const set = new Set(claves);
  const completo = grupo.length > 0 && grupo.every((k) => set.has(k));
  for (const k of grupo) {
    if (completo) set.delete(k);
    else set.add(k);
  }
  return [...set];
}

export function itemsDesdeClaves(
  claves: readonly string[],
): { categoria_id: string; subtipo_id: string | null }[] {
  return claves.map((clave) => {
    const corte = clave.indexOf(":");
    const categoria_id = clave.slice(0, corte);
    const subtipo = clave.slice(corte + 1);
    return { categoria_id, subtipo_id: subtipo ? subtipo : null };
  });
}

export function subtipoPermitido(vista: Vista, categoriaId: string, subtipoId: string): boolean {
  if (vista.todo) return true;
  return vista.pares.has(claveHoja(categoriaId, subtipoId));
}

export function categoriaPermitida(
  vista: Vista,
  categoriaId: string,
  subtipoIds: readonly string[],
): boolean {
  if (vista.todo) return true;
  if (subtipoIds.length === 0) return vista.pares.has(claveHoja(categoriaId, null));
  return subtipoIds.some((id) => vista.pares.has(claveHoja(categoriaId, id)));
}

export function filtrarMenuPorVista<T extends { id: string; subtipos: { id: string }[] }>(
  categorias: T[],
  vista: Vista,
): T[] {
  if (vista.todo) return categorias;
  return categorias.flatMap((c) => {
    if (c.subtipos.length === 0) {
      return vista.pares.has(claveHoja(c.id, null)) ? [c] : [];
    }
    const subtipos = c.subtipos.filter((s) => vista.pares.has(claveHoja(c.id, s.id)));
    if (subtipos.length === 0) return [];
    return [{ ...c, subtipos }];
  });
}
