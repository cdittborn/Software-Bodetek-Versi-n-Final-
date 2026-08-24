import type {
  EstadoLluvias,
  GravedadLluvias,
} from "@/lib/trabajos";
import type { ProyectoFiltracionEnriquecido } from "@/lib/filtracion/completitud";

export type KpiFiltro =
  | "sin_asignar"
  | "criticas_abiertas"
  | "sin_despues"
  | "entrega_atrasada";

export type FiltrosEventoState = {
  busqueda: string;
  kpiActivo: KpiFiltro | null;
  gravedades: GravedadLluvias[];
  estados: EstadoLluvias[];
};

const ORDEN_GRAVEDAD: Record<string, number> = {
  critico: 0,
  medio: 1,
  bajo: 2,
};

function normalizar(texto: string): string {
  return texto.trim().toLowerCase();
}

function coincideBusqueda(p: ProyectoFiltracionEnriquecido, q: string): boolean {
  if (!q) return true;
  const n = normalizar(q);
  const codigo = normalizar(p.recinto_codigo ?? "");
  const arrendatario = normalizar(p.recinto_arrendatario ?? "");
  const cotizacion = normalizar(p.numero_cotizacion ?? "");
  return (
    codigo.includes(n) || arrendatario.includes(n) || cotizacion.includes(n)
  );
}

function coincideKpi(p: ProyectoFiltracionEnriquecido, kpi: KpiFiltro | null): boolean {
  if (!kpi) return true;
  switch (kpi) {
    case "sin_asignar":
      return p.estado === "sin_asignar";
    case "criticas_abiertas":
      return p.gravedad === "critico" && p.estado !== "terminado";
    case "sin_despues":
      return p.sinDespues;
    case "entrega_atrasada":
      return p.entregaAtrasada;
    default:
      return true;
  }
}

export function ordenarProyectos(
  proyectos: ProyectoFiltracionEnriquecido[],
): ProyectoFiltracionEnriquecido[] {
  return [...proyectos].sort((a, b) => {
    const ga = ORDEN_GRAVEDAD[a.gravedad ?? ""] ?? 99;
    const gb = ORDEN_GRAVEDAD[b.gravedad ?? ""] ?? 99;
    if (ga !== gb) return ga - gb;
    const fa = a.completitud.faltantes.length;
    const fb = b.completitud.faltantes.length;
    if (fa !== fb) return fb - fa;
    return (a.recinto_codigo ?? "").localeCompare(b.recinto_codigo ?? "", "es");
  });
}

export function filtrarProyectos(
  proyectos: ProyectoFiltracionEnriquecido[],
  filtros: FiltrosEventoState,
): ProyectoFiltracionEnriquecido[] {
  const q = normalizar(filtros.busqueda);
  return proyectos.filter((p) => {
    if (!coincideBusqueda(p, q)) return false;
    if (!coincideKpi(p, filtros.kpiActivo)) return false;
    if (
      filtros.gravedades.length > 0 &&
      (!p.gravedad ||
        !filtros.gravedades.includes(p.gravedad as GravedadLluvias))
    ) {
      return false;
    }
    if (
      filtros.estados.length > 0 &&
      !filtros.estados.includes(p.estado as EstadoLluvias)
    ) {
      return false;
    }
    return true;
  });
}

export function contarKpis(proyectos: ProyectoFiltracionEnriquecido[]) {
  return {
    sin_asignar: proyectos.filter((p) => p.estado === "sin_asignar").length,
    criticas_abiertas: proyectos.filter(
      (p) => p.gravedad === "critico" && p.estado !== "terminado",
    ).length,
    sin_despues: proyectos.filter((p) => p.sinDespues).length,
    entrega_atrasada: proyectos.filter((p) => p.entregaAtrasada).length,
  };
}

export function fechaMasRecienteEvento(
  proyectos: ProyectoFiltracionEnriquecido[],
): string | null {
  let max: number | null = null;
  for (const p of proyectos) {
    const t = new Date(p.created_at).getTime();
    if (max == null || t > max) max = t;
    for (const bucket of [
      p.media.antes,
      p.media.despues,
      p.media.plano_agua,
      p.media.plano_reparacion,
      p.media.cotizacion,
    ]) {
      for (const m of bucket) {
        const mt = new Date(m.created_at).getTime();
        if (max == null || mt > max) max = mt;
      }
    }
  }
  return max == null ? null : new Date(max).toISOString();
}

export function formatHace(iso: string | null): string | null {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} día${days === 1 ? "" : "s"}`;
}

export function sumaMontos(proyectos: ProyectoFiltracionEnriquecido[]) {
  let valorEvento = 0;
  let cotizaciones = 0;
  for (const p of proyectos) {
    if (p.valor_reparacion != null) valorEvento += p.valor_reparacion;
    if (p.valor_total_cotizacion != null) cotizaciones += p.valor_total_cotizacion;
  }
  return { valorEvento, cotizaciones };
}
