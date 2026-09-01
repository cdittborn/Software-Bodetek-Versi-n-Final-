import type { GravedadLluvias } from "@/lib/trabajos";
import {
  cotizacionCompletaDesdeEmergencia,
  type ProyectoFiltracionEnriquecido,
} from "@/lib/filtracion/completitud";
import { tiposActivos } from "@/lib/filtracion/problemas";

export type KpiFiltro =
  | "sin_antes"
  | "sin_despues"
  | "sin_plano_agua"
  | "sin_plano_reparacion"
  | "sin_asignar"
  | "asignados_proveedor"
  | "sin_cotizacion"
  | "sin_fecha_entrega"
  | "sin_empezar";

export type FiltroTarjetaDashboard =
  | KpiFiltro
  | "entregados"
  | "asignados_maestros";

export type DesgloseGravedad = Record<GravedadLluvias, number>;

export const LABEL_FILTRO_TARJETA: Record<FiltroTarjetaDashboard, string> = {
  entregados: "Entregados",
  sin_empezar: "Sin empezar",
  sin_fecha_entrega: "Sin fecha de entrega estimada",
  sin_antes: "Sin fotos/videos de antes",
  sin_despues: "Sin fotos/videos de después",
  sin_plano_agua: "Sin plano (agua)",
  sin_plano_reparacion: "Sin plano (reparación)",
  sin_asignar: "Sin asignar",
  asignados_maestros: "Asignados a Maestros Bodetek",
  asignados_proveedor: "Asignados a proveedor externo",
  sin_cotizacion: "Sin cotización",
};

export function desgloseGravedadVacio(): DesgloseGravedad {
  return { critico: 0, medio: 0, bajo: 0 };
}

export function contarPorGravedad(
  proyectos: ProyectoFiltracionEnriquecido[],
): DesgloseGravedad {
  const counts = desgloseGravedadVacio();
  for (const p of proyectos) {
    if (p.gravedad === "critico") counts.critico += 1;
    else if (p.gravedad === "medio") counts.medio += 1;
    else if (p.gravedad === "bajo") counts.bajo += 1;
  }
  return counts;
}

export function desgloseGravedadEnCondicion(
  proyectos: ProyectoFiltracionEnriquecido[],
  predicado: (p: ProyectoFiltracionEnriquecido) => boolean,
): DesgloseGravedad {
  return contarPorGravedad(proyectos.filter(predicado));
}

export function desgloseGravedadResto(
  proyectos: ProyectoFiltracionEnriquecido[],
  predicado: (p: ProyectoFiltracionEnriquecido) => boolean,
): DesgloseGravedad {
  return contarPorGravedad(proyectos.filter((p) => !predicado(p)));
}

export function filtrarPorGravedades(
  proyectos: ProyectoFiltracionEnriquecido[],
  gravedades: GravedadLluvias[],
): ProyectoFiltracionEnriquecido[] {
  if (gravedades.length === 0) return proyectos;
  return proyectos.filter(
    (p) => p.gravedad && gravedades.includes(p.gravedad as GravedadLluvias),
  );
}

export function filtrarPorTarjetaDashboard(
  proyectos: ProyectoFiltracionEnriquecido[],
  tarjeta: FiltroTarjetaDashboard | null,
): ProyectoFiltracionEnriquecido[] {
  if (!tarjeta) return proyectos;
  return proyectos.filter((p) => coincideFiltroTarjeta(p, tarjeta));
}

export type FiltrosEventoState = {
  busqueda: string;
  kpiActivo: KpiFiltro | null;
};

const ESTADOS_SIN_EMPEZAR = ["sin_empezar"] as const;

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

export function esSinAsignarEjecutado(
  p: ProyectoFiltracionEnriquecido,
): boolean {
  return p.ejecutado_por == null;
}

export function esAsignadoProveedorExterno(
  p: ProyectoFiltracionEnriquecido,
): boolean {
  return p.ejecutado_por === "proveedor_externo";
}

export function esSinCotizacionProveedor(
  p: ProyectoFiltracionEnriquecido,
): boolean {
  const hayProveedor = tiposActivos(p.problemas).some(
    (t) => p.problemas[t].ejecutadoPor === "proveedor_externo",
  );
  if (hayProveedor) return !cotizacionCompletaDesdeEmergencia(p);
  return (
    esAsignadoProveedorExterno(p) &&
    !cotizacionCompletaDesdeEmergencia(p)
  );
}

export function esSinEmpezar(p: ProyectoFiltracionEnriquecido): boolean {
  return (ESTADOS_SIN_EMPEZAR as readonly string[]).includes(p.estado);
}

export function esEntregado(p: ProyectoFiltracionEnriquecido): boolean {
  return p.fecha_termino != null;
}

export function esAsignadoMaestrosBodetek(
  p: ProyectoFiltracionEnriquecido,
): boolean {
  return p.ejecutado_por === "maestros_bodetek";
}

export function coincideFiltroTarjeta(
  p: ProyectoFiltracionEnriquecido,
  filtro: FiltroTarjetaDashboard,
): boolean {
  switch (filtro) {
    case "entregados":
      return esEntregado(p);
    case "asignados_maestros":
      return esAsignadoMaestrosBodetek(p);
    default:
      return coincideKpi(p, filtro);
  }
}

export function coincideKpi(
  p: ProyectoFiltracionEnriquecido,
  kpi: KpiFiltro,
): boolean {
  switch (kpi) {
    case "sin_antes":
      return p.media.antes.length === 0;
    case "sin_despues":
      return p.media.despues.length === 0;
    case "sin_plano_agua":
      return p.media.plano_agua.length === 0;
    case "sin_plano_reparacion":
      return p.media.plano_reparacion.length === 0;
    case "sin_asignar":
      return esSinAsignarEjecutado(p);
    case "asignados_proveedor":
      return esAsignadoProveedorExterno(p);
    case "sin_cotizacion":
      return esSinCotizacionProveedor(p);
    case "sin_fecha_entrega":
      return p.fecha_entrega_estimada == null;
    case "sin_empezar":
      return esSinEmpezar(p);
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
    if (filtros.kpiActivo && !coincideKpi(p, filtros.kpiActivo)) return false;
    return true;
  });
}

export function contarKpis(
  proyectos: ProyectoFiltracionEnriquecido[],
): Record<KpiFiltro, number> {
  const counts: Record<KpiFiltro, number> = {
    sin_antes: 0,
    sin_despues: 0,
    sin_plano_agua: 0,
    sin_plano_reparacion: 0,
    sin_asignar: 0,
    asignados_proveedor: 0,
    sin_cotizacion: 0,
    sin_fecha_entrega: 0,
    sin_empezar: 0,
  };

  for (const p of proyectos) {
    if (coincideKpi(p, "sin_antes")) counts.sin_antes += 1;
    if (coincideKpi(p, "sin_despues")) counts.sin_despues += 1;
    if (coincideKpi(p, "sin_plano_agua")) counts.sin_plano_agua += 1;
    if (coincideKpi(p, "sin_plano_reparacion")) counts.sin_plano_reparacion += 1;
    if (coincideKpi(p, "sin_asignar")) counts.sin_asignar += 1;
    if (coincideKpi(p, "asignados_proveedor")) counts.asignados_proveedor += 1;
    if (coincideKpi(p, "sin_cotizacion")) counts.sin_cotizacion += 1;
    if (coincideKpi(p, "sin_fecha_entrega")) counts.sin_fecha_entrega += 1;
    if (coincideKpi(p, "sin_empezar")) counts.sin_empezar += 1;
  }

  return counts;
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
