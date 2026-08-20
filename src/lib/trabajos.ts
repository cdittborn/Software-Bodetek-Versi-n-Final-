export const SUBTIPO_LLUVIAS_Y_TEMPORALES = "Lluvias y temporales";
export const CATEGORIA_PATENTES = "Patentes";
export const CATEGORIA_OTROS_TRABAJOS_CD = "Otros trabajos CD";
export const SUBTIPO_CLIENTES_PATENTES = "Clientes con patentes en proceso";
export const SUBTIPO_RECEPCION_OBRAS = "Proyecto recepción de obras";
export const SUBTIPO_REVISIONES_MANTENCIONES =
  "Revisiones y mantenciones periódicas";

export function isSubtipoLluviasYTemporales(nombre: string): boolean {
  return nombre === SUBTIPO_LLUVIAS_Y_TEMPORALES || nombre === "Emergencias";
}

export function isSubtipoClientesPatentes(nombre: string): boolean {
  return nombre === SUBTIPO_CLIENTES_PATENTES;
}

export function isSubtipoRecepcionObras(nombre: string): boolean {
  return nombre === SUBTIPO_RECEPCION_OBRAS;
}

export function isSubtipoPatentes(nombre: string): boolean {
  return isSubtipoClientesPatentes(nombre) || isSubtipoRecepcionObras(nombre);
}

export function isSubtipoRevisionesMantenciones(nombre: string): boolean {
  return nombre === SUBTIPO_REVISIONES_MANTENCIONES;
}

export function isCategoriaOtrosTrabajosCD(nombre: string): boolean {
  return nombre === CATEGORIA_OTROS_TRABAJOS_CD;
}

/** Título corto desde la primera línea de la descripción (tareas privadas). */
export function tituloDesdeDescripcion(descripcion: string): string {
  const first =
    descripcion
      .trim()
      .split(/\r?\n/)
      .find((line) => line.trim().length > 0)
      ?.trim() ?? "Tarea";
  return first.length > 80 ? `${first.slice(0, 77)}…` : first;
}

export type TareaPrivadaListado = {
  id: string;
  titulo: string;
  descripcion: string | null;
  created_at: string;
  categoria_id: string;
  subtipo_id: string;
};

export const ESTADOS_TRABAJO = [
  "planificado",
  "en_curso",
  "completado",
  "mantencion_periodica",
] as const;

/** Estados legacy (Patentes / datos viejos). */
export const ESTADOS_EMERGENCIA = [
  "pendiente",
  "en_proceso",
  "terminado",
] as const;

/** Estados de Filtración-Proyecto (Lluvias y temporales). */
export const ESTADOS_LLUVIAS = [
  "sin_asignar",
  "asignado_proveedor_sin_empezar",
  "asignado_maestros_sin_empezar",
  "asignado_proveedor_en_proceso",
  "asignado_maestros_en_proceso",
  "terminado",
] as const;

export const GRAVEDADES_LLUVIAS = ["critico", "medio", "bajo"] as const;

export const EJECUTADO_POR_OPCIONES = [
  "maestros_bodetek",
  "proveedor_externo",
  "ambos",
] as const;

export const ESTADOS_TRABAJO_TODOS = [
  ...ESTADOS_TRABAJO,
  ...ESTADOS_EMERGENCIA,
  ...ESTADOS_LLUVIAS.filter((e) => e !== "terminado"),
] as const;

export type EstadoTrabajo = (typeof ESTADOS_TRABAJO)[number];
export type EstadoEmergencia = (typeof ESTADOS_EMERGENCIA)[number];
export type EstadoLluvias = (typeof ESTADOS_LLUVIAS)[number];
export type GravedadLluvias = (typeof GRAVEDADES_LLUVIAS)[number];
export type EjecutadoPor = (typeof EJECUTADO_POR_OPCIONES)[number];
export type EstadoTrabajoTodos = (typeof ESTADOS_TRABAJO_TODOS)[number];

export const ESTADO_TRABAJO_LABEL: Record<string, string> = {
  planificado: "Planificado",
  en_curso: "En curso",
  completado: "Completado",
  mantencion_periodica: "Mantención periódica",
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  terminado: "Terminado",
  sin_asignar: "Sin asignar",
  asignado_proveedor_sin_empezar: "Asignado a proveedor (sin empezar)",
  asignado_maestros_sin_empezar: "Asignado a maestros (sin empezar)",
  asignado_proveedor_en_proceso: "Asignado a proveedor (en proceso)",
  asignado_maestros_en_proceso: "Asignado a maestros (en proceso)",
};

export const GRAVEDAD_LLUVIAS_LABEL: Record<GravedadLluvias, string> = {
  critico: "Crítico",
  medio: "Medio",
  bajo: "Bajo",
};

export const EJECUTADO_POR_LABEL: Record<EjecutadoPor, string> = {
  maestros_bodetek: "Maestros Bodetek",
  proveedor_externo: "Proveedor externo",
  ambos: "Ambos",
};

export const ESTADO_LLUVIAS_BADGE: Record<EstadoLluvias, string> = {
  sin_asignar: "bg-zinc-200 text-zinc-700",
  asignado_proveedor_sin_empezar: "bg-sky-100 text-sky-800",
  asignado_maestros_sin_empezar: "bg-violet-100 text-violet-800",
  asignado_proveedor_en_proceso: "bg-amber-100 text-amber-800",
  asignado_maestros_en_proceso: "bg-orange-100 text-orange-800",
  terminado: "bg-emerald-100 text-emerald-800",
};

export const GRAVEDAD_LLUVIAS_BADGE: Record<GravedadLluvias, string> = {
  critico: "bg-red-100 text-red-800",
  medio: "bg-amber-100 text-amber-800",
  bajo: "bg-emerald-100 text-emerald-800",
};

export function isEstadoLluvias(value: string): value is EstadoLluvias {
  return (ESTADOS_LLUVIAS as readonly string[]).includes(value);
}

export function isGravedadLluvias(value: string): value is GravedadLluvias {
  return (GRAVEDADES_LLUVIAS as readonly string[]).includes(value);
}

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
  gravedad: string | null;
  ejecutado_por: string | null;
  proveedor: string | null;
  valor_reparacion: number | null;
  created_at: string;
  fecha_inicio: string | null;
  fecha_entrega_estimada: string | null;
  recinto_id: string | null;
  recinto_codigo: string | null;
  recinto_nombre: string | null;
  recinto_arrendatario: string | null;
  categoria_id: string;
  subtipo_id: string;
  evento_id?: string | null;
};

export type TrabajoMediaTipo =
  | "antes"
  | "despues"
  | "adjunto"
  | "patente_provisoria"
  | "cotizacion"
  | "plano_filtraciones";

export const ESTADOS_ACCION = [
  "pendiente",
  "en_proceso",
  "terminada",
] as const;

export type EstadoAccion = (typeof ESTADOS_ACCION)[number];

export const ESTADO_ACCION_LABEL: Record<EstadoAccion, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  terminada: "Terminada",
};

export type TrabajoMediaTipoArchivo = "foto" | "video" | "documento";

export type TrabajoMediaItem = {
  id: string;
  tipo: TrabajoMediaTipo;
  tipo_archivo: TrabajoMediaTipoArchivo;
  url: string;
  publicUrl: string;
  nombre_archivo: string | null;
  created_at: string;
};

export type EmergenciaListadoMedia = {
  antes: TrabajoMediaItem[];
  despues: TrabajoMediaItem[];
  plano_filtraciones: TrabajoMediaItem[];
  cotizacion: TrabajoMediaItem[];
};

export type EmergenciaConMedia = EmergenciaListado & {
  media: EmergenciaListadoMedia;
};

export type ProyectoPatenteListado = {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: string;
  created_at: string;
  fecha_termino: string | null;
  recinto_id: string | null;
  recinto_codigo: string | null;
  recinto_nombre: string | null;
  categoria_id: string;
  subtipo_id: string;
};

export type TrabajoAccion = {
  id: string;
  descripcion: string;
  fecha_entrega: string | null;
  hecha: boolean;
  estado: EstadoAccion;
  created_at: string;
};

export type TechoListado = {
  id: string;
  titulo: string;
  descripcion: string | null;
  materiales: string | null;
  plan_accion: string | null;
  estado: string;
  created_at: string;
  periodicidad_dias: number | null;
  fecha_ultima_revision: string | null;
  proxima_mantencion: string | null;
  categoria_id: string;
  subtipo_id: string;
};

export function addDaysIso(baseIso: string, days: number): string {
  const date = new Date(`${baseIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function proximaRevisionIso(
  fechaUltima: string | null | undefined,
  periodicidadDias: number | null | undefined,
): string | null {
  if (!fechaUltima || !periodicidadDias || periodicidadDias <= 0) return null;
  return addDaysIso(fechaUltima, periodicidadDias);
}

export type TrabajoPresupuestoItem = {
  id: string;
  concepto: string;
  monto: number;
  created_at: string;
};

export type TrabajoPago = {
  id: string;
  hito: string;
  monto: number | null;
  fecha_pago: string | null;
  created_at: string;
};

export function trabajoHref(
  categoriaId: string,
  subtipoId: string,
  trabajoId: string,
) {
  return `${subtipoHref(categoriaId, subtipoId)}/${trabajoId}`;
}

export function formatFechaCl(value: string | null | undefined): string {
  if (!value) return "—";
  const d = value.includes("T")
    ? new Date(value)
    : new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function formatMontoClp(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function kindFromFile(file: File): TrabajoMediaTipoArchivo {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "foto";
  return "documento";
}

export function parseMonto(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

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

export function eventoHref(
  categoriaId: string,
  subtipoId: string,
  eventoId: string,
) {
  return `${subtipoHref(categoriaId, subtipoId)}/e/${eventoId}`;
}

export function eventoDashboardHref(
  categoriaId: string,
  subtipoId: string,
  eventoId: string,
) {
  return `${eventoHref(categoriaId, subtipoId, eventoId)}/dashboard`;
}

export type EventoListado = {
  id: string;
  nombre: string;
  fecha: string;
  created_at: string;
  proyectos_count?: number;
};

/** Techumbres siempre primero; Otros / Otros trabajos CD al final; resto alfabético. */
export function sortCategoriasConOtrosAlFinal<T extends { nombre: string }>(
  categorias: T[],
): T[] {
  const isOtros = (nombre: string) =>
    nombre === "Otros" || nombre === CATEGORIA_OTROS_TRABAJOS_CD;
  const isTechumbres = (nombre: string) =>
    nombre === "Techumbres y canales";

  const techumbres = categorias.filter((c) => isTechumbres(c.nombre));
  const otros = categorias.filter((c) => isOtros(c.nombre));
  const rest = categorias
    .filter((c) => !isTechumbres(c.nombre) && !isOtros(c.nombre))
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return [...techumbres, ...rest, ...otros];
}

