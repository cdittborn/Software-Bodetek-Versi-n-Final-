export const SUBTIPO_LLUVIAS_Y_TEMPORALES = "Lluvias y temporales";

export function isSubtipoLluviasYTemporales(nombre: string): boolean {
  return nombre === SUBTIPO_LLUVIAS_Y_TEMPORALES || nombre === "Emergencias";
}

export const ESTADOS_TRABAJO = [
  "planificado",
  "en_curso",
  "completado",
  "mantencion_periodica",
] as const;

export const ESTADOS_EMERGENCIA = [
  "pendiente",
  "en_proceso",
  "terminado",
] as const;

export const ESTADOS_TRABAJO_TODOS = [
  ...ESTADOS_TRABAJO,
  ...ESTADOS_EMERGENCIA,
] as const;

export type EstadoTrabajo = (typeof ESTADOS_TRABAJO)[number];
export type EstadoEmergencia = (typeof ESTADOS_EMERGENCIA)[number];
export type EstadoTrabajoTodos = (typeof ESTADOS_TRABAJO_TODOS)[number];

export const ESTADO_TRABAJO_LABEL: Record<EstadoTrabajoTodos, string> = {
  planificado: "Planificado",
  en_curso: "En curso",
  completado: "Completado",
  mantencion_periodica: "Mantención periódica",
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  terminado: "Terminado",
};

export type TrabajoListado = {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: string;
  fecha_inicio: string | null;
  fecha_termino: string | null;
  periodicidad_dias: number | null;
  proxima_mantencion: string | null;
  created_at: string;
  categoria_nombre: string | null;
  categoria_id: string | null;
  subtipo_id: string | null;
  subtipo_nombre: string | null;
  recinto_id: string | null;
  recinto_codigo: string | null;
  responsable_id: string | null;
  responsable_nombre: string | null;
};

export type CategoriaOption = {
  id: string;
  nombre: string;
};

export type SubtipoOption = {
  id: string;
  nombre: string;
  categoria_id: string;
};

export type RecintoOption = {
  id: string;
  codigo: string;
  nombre: string;
  arrendatario_actual: string | null;
};

export function etiquetaRecintoSelector(r: RecintoOption): string {
  const arrendatario = r.arrendatario_actual?.trim();
  return arrendatario ? `${r.codigo} — ${arrendatario}` : r.codigo;
}

export type PerfilOption = {
  id: string;
  nombre: string | null;
};

export type CategoriaNav = {
  id: string;
  nombre: string;
  subtipos: SubtipoOption[];
};

export type EmergenciaListado = {
  id: string;
  titulo: string;
  descripcion: string | null;
  plan_accion: string | null;
  estado: string;
  created_at: string;
  fecha_inicio: string | null;
  recinto_id: string | null;
  recinto_codigo: string | null;
  recinto_nombre: string | null;
  categoria_id: string;
  subtipo_id: string;
};

export type TrabajoMediaItem = {
  id: string;
  tipo: "antes" | "despues";
  tipo_archivo: "foto" | "video";
  url: string;
  publicUrl: string;
  created_at: string;
};

export const ESTADO_EMERGENCIA_BADGE: Record<
  EstadoEmergencia,
  string
> = {
  pendiente: "bg-zinc-200 text-zinc-700",
  en_proceso: "bg-amber-100 text-amber-800",
  terminado: "bg-emerald-100 text-emerald-800",
};

export function isEstadoEmergencia(value: string): value is EstadoEmergencia {
  return (ESTADOS_EMERGENCIA as readonly string[]).includes(value);
}

export function subtipoHref(categoriaId: string, subtipoId: string) {
  return `/trabajos/c/${categoriaId}/s/${subtipoId}`;
}

/** "Otros" siempre al final; el resto conserva el orden recibido. */
export function sortCategoriasConOtrosAlFinal<T extends { nombre: string }>(
  categorias: T[],
): T[] {
  const rest = categorias.filter((c) => c.nombre !== "Otros");
  const otros = categorias.filter((c) => c.nombre === "Otros");
  return [...rest, ...otros];
}

