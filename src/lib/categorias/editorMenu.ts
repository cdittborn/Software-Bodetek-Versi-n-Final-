import { colorPorPosicion, siguienteColor } from "@/lib/menu";

/** Lo que el menú recibe de la base para cada categoría. */
export type SubtipoMenu = {
  id: string;
  nombre: string;
  protegida: boolean;
  trabajos: number;
};

export type CategoriaMenu = {
  id: string;
  nombre: string;
  color: string | null;
  protegida: boolean;
  trabajos: number;
  subtipos: SubtipoMenu[];
};

/** Fila en edición. `id` null = nueva, todavía no existe en la base. */
export type SubtipoEditable = SubtipoMenu & { key: string; idBase: string | null };
export type CategoriaEditable = Omit<CategoriaMenu, "subtipos" | "color"> & {
  key: string;
  idBase: string | null;
  color: string;
  subtipos: SubtipoEditable[];
};

export type EstadoEditor = {
  categorias: CategoriaEditable[];
  eliminarCategorias: string[];
  eliminarSubtipos: string[];
  nuevas: number;
};

export type PayloadMenu = {
  categorias: {
    id: string | null;
    nombre: string;
    color: string;
    subtipos: { id: string | null; nombre: string }[];
  }[];
  eliminar_subtipos: string[];
  eliminar_categorias: string[];
};

export const NOMBRE_MAXIMO = 80;

export function crearEstado(categorias: CategoriaMenu[]): EstadoEditor {
  return {
    categorias: categorias.map((c, i) => ({
      ...c,
      key: c.id,
      idBase: c.id,
      color: c.color ?? colorPorPosicion(i).color,
      subtipos: c.subtipos.map((s) => ({ ...s, key: s.id, idBase: s.id })),
    })),
    eliminarCategorias: [],
    eliminarSubtipos: [],
    nuevas: 0,
  };
}

export function mover<T>(lista: T[], desde: number, hasta: number): T[] {
  if (desde === hasta || desde < 0 || hasta < 0 || desde >= lista.length || hasta >= lista.length) {
    return lista;
  }
  const copia = lista.slice();
  const [fila] = copia.splice(desde, 1);
  copia.splice(hasta, 0, fila!);
  return copia;
}

function conCategoria(
  estado: EstadoEditor,
  key: string,
  cambio: (c: CategoriaEditable) => CategoriaEditable,
): EstadoEditor {
  return {
    ...estado,
    categorias: estado.categorias.map((c) => (c.key === key ? cambio(c) : c)),
  };
}

export function moverCategoria(estado: EstadoEditor, desde: number, hasta: number): EstadoEditor {
  return { ...estado, categorias: mover(estado.categorias, desde, hasta) };
}

export function moverSubtipo(
  estado: EstadoEditor,
  catKey: string,
  desde: number,
  hasta: number,
): EstadoEditor {
  return conCategoria(estado, catKey, (c) => ({ ...c, subtipos: mover(c.subtipos, desde, hasta) }));
}

export function renombrarCategoria(estado: EstadoEditor, key: string, nombre: string): EstadoEditor {
  return conCategoria(estado, key, (c) => ({ ...c, nombre }));
}

export function renombrarSubtipo(
  estado: EstadoEditor,
  catKey: string,
  subKey: string,
  nombre: string,
): EstadoEditor {
  return conCategoria(estado, catKey, (c) => ({
    ...c,
    subtipos: c.subtipos.map((s) => (s.key === subKey ? { ...s, nombre } : s)),
  }));
}

export function cambiarColor(estado: EstadoEditor, key: string): EstadoEditor {
  return conCategoria(estado, key, (c) => ({ ...c, color: siguienteColor(c.color) }));
}

export function agregarCategoria(estado: EstadoEditor): EstadoEditor {
  const nuevas = estado.nuevas + 1;
  return {
    ...estado,
    nuevas,
    categorias: [
      ...estado.categorias,
      {
        id: "",
        idBase: null,
        key: `nueva-${nuevas}`,
        nombre: "Nueva categoría",
        color: colorPorPosicion(estado.categorias.length).color,
        protegida: false,
        trabajos: 0,
        subtipos: [],
      },
    ],
  };
}

export function agregarSubtipo(estado: EstadoEditor, catKey: string): EstadoEditor {
  const nuevas = estado.nuevas + 1;
  return conCategoria({ ...estado, nuevas }, catKey, (c) => ({
    ...c,
    subtipos: [
      ...c.subtipos,
      {
        id: "",
        idBase: null,
        key: `nueva-${nuevas}`,
        nombre: "Nueva subcategoría",
        protegida: false,
        trabajos: 0,
      },
    ],
  }));
}

function textoTrabajos(n: number): string {
  return n === 1 ? "Tiene 1 trabajo; muévelo antes de eliminar." : `Tiene ${n} trabajos; muévelos antes de eliminar.`;
}

/** null si se puede eliminar; si no, el motivo para mostrar en la fila. */
export function motivoNoEliminarCategoria(c: CategoriaEditable): string | null {
  if (c.protegida || c.subtipos.some((s) => s.protegida)) {
    return "Esta categoría tiene secciones propias del sistema y no se puede eliminar.";
  }
  const trabajos = c.trabajos + c.subtipos.reduce((n, s) => n + s.trabajos, 0);
  if (trabajos > 0) return textoTrabajos(trabajos);
  return null;
}

export function motivoNoEliminarSubtipo(s: SubtipoEditable): string | null {
  if (s.protegida) return "Esta subcategoría es una sección propia del sistema y no se puede eliminar.";
  if (s.trabajos > 0) return textoTrabajos(s.trabajos);
  return null;
}

/** Marca la categoría para eliminar al tocar Listo. Sus subcategorías se van con ella. */
export function eliminarCategoria(estado: EstadoEditor, key: string): EstadoEditor {
  const c = estado.categorias.find((x) => x.key === key);
  if (!c || motivoNoEliminarCategoria(c)) return estado;
  return {
    ...estado,
    categorias: estado.categorias.filter((x) => x.key !== key),
    eliminarCategorias: c.idBase ? [...estado.eliminarCategorias, c.idBase] : estado.eliminarCategorias,
  };
}

export function eliminarSubtipo(estado: EstadoEditor, catKey: string, subKey: string): EstadoEditor {
  const c = estado.categorias.find((x) => x.key === catKey);
  const s = c?.subtipos.find((x) => x.key === subKey);
  if (!c || !s || motivoNoEliminarSubtipo(s)) return estado;
  return {
    ...conCategoria(estado, catKey, (x) => ({
      ...x,
      subtipos: x.subtipos.filter((y) => y.key !== subKey),
    })),
    eliminarSubtipos: s.idBase ? [...estado.eliminarSubtipos, s.idBase] : estado.eliminarSubtipos,
  };
}

/** Errores que impiden guardar, en el orden del menú. */
export function erroresEditor(estado: EstadoEditor): string[] {
  const errores: string[] = [];
  const revisar = (nombre: string, tipo: string) => {
    const limpio = nombre.trim();
    if (!limpio) errores.push(`Hay una ${tipo} sin nombre.`);
    else if (limpio.length > NOMBRE_MAXIMO) {
      errores.push(`«${limpio.slice(0, 30)}…» es muy largo (máximo ${NOMBRE_MAXIMO} caracteres).`);
    }
  };
  for (const c of estado.categorias) {
    revisar(c.nombre, "categoría");
    for (const s of c.subtipos) revisar(s.nombre, "subcategoría");
  }
  return [...new Set(errores)];
}

export function construirPayload(estado: EstadoEditor): PayloadMenu {
  return {
    categorias: estado.categorias.map((c) => ({
      id: c.idBase,
      nombre: c.nombre.trim(),
      color: c.color,
      subtipos: c.subtipos.map((s) => ({ id: s.idBase, nombre: s.nombre.trim() })),
    })),
    eliminar_subtipos: estado.eliminarSubtipos,
    eliminar_categorias: estado.eliminarCategorias,
  };
}

export function hayCambios(inicial: EstadoEditor, actual: EstadoEditor): boolean {
  return JSON.stringify(construirPayload(inicial)) !== JSON.stringify(construirPayload(actual));
}
