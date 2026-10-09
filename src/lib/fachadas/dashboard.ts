/** Agregados del dashboard Fachadas (captura 1). Sin I/O. */

import {
  ESTADOS_CALCULADOS_FACHADA,
  type EstadoCalculadoFachada,
} from "@/lib/fachadas/estado";
import {
  costoNetoIntervencion,
  estadoCalculadoFachada,
  filtrarIntervenciones,
  tieneSuperficieM2,
  TIPOS_INTERVENCION_FACHADA,
  type FachadaIndicadores,
  type FiltroDashboardFachadas,
  type IntervencionIndicadores,
  type TipoIntervencionFachada,
} from "@/lib/fachadas/indicadores";
import { estadoAFecha, estadoPlano } from "@/lib/fachadas/estado-a-fecha";
import { hoyIsoChile } from "@/lib/fachadas/ficha";
import type { EstadoPlano } from "@/lib/fachadas/plano";
import type { FachadaListadoItem, UbicacionFachada } from "@/lib/fachadas/tipos";

export function listadoAIndicadores(f: FachadaListadoItem): FachadaIndicadores {
  return {
    id: f.id,
    nombre: f.nombre,
    recintoId: f.recintoId,
    superficieM2: f.superficieM2,
    frecuenciaLimpiezaMeses: f.frecuenciaLimpiezaMeses,
    frecuenciaReparacionMeses: f.frecuenciaReparacionMeses,
    frecuenciaPinturaMeses: f.frecuenciaPinturaMeses,
    frecuenciaRevisionMeses: f.frecuenciaRevisionMeses,
    letra: f.letra,
    codigoRecinto: f.recintoCodigo,
    ultimaLimpiezaFecha: f.ultimaLimpiezaFecha,
    ultimaReparacionFecha: f.ultimaReparacionFecha,
    ultimaPinturaFecha: f.ultimaPinturaFecha,
  };
}

export function estadoDeListado(
  f: FachadaListadoItem,
  intervenciones: IntervencionIndicadores[],
  hoy = hoyIsoChile(),
): EstadoCalculadoFachada {
  return estadoCalculadoFachada(listadoAIndicadores(f), intervenciones, hoy);
}

export type ConteosEstadoFachada = Record<EstadoCalculadoFachada, number> & {
  total: number;
  intervenidas: number;
  pendientes: number;
};

export function conteosEstado(
  fachadas: FachadaListadoItem[],
  intervenciones: IntervencionIndicadores[],
  hoy = hoyIsoChile(),
): ConteosEstadoFachada {
  const out: ConteosEstadoFachada = {
    al_dia: 0,
    en_ejecucion: 0,
    programada: 0,
    requiere_trabajo: 0,
    total: fachadas.length,
    intervenidas: 0,
    pendientes: 0,
  };
  for (const f of fachadas) {
    const e = estadoDeListado(f, intervenciones, hoy);
    out[e] += 1;
  }
  out.intervenidas = out.al_dia + out.en_ejecucion;
  out.pendientes = out.programada + out.requiere_trabajo;
  return out;
}

export type TrabajoRealizado = {
  key: TipoIntervencionFachada | "hojalateria";
  fachadasN: number;
  dias: number;
  neto: number;
};

export function trabajosRealizados(
  intervenciones: IntervencionIndicadores[],
): TrabajoRealizado[] {
  const acc: Record<
    TipoIntervencionFachada | "hojalateria",
    { fachadas: Set<string>; dias: number; neto: number }
  > = {
    limpieza: { fachadas: new Set(), dias: 0, neto: 0 },
    reparacion: { fachadas: new Set(), dias: 0, neto: 0 },
    pintura: { fachadas: new Set(), dias: 0, neto: 0 },
    hojalateria: { fachadas: new Set(), dias: 0, neto: 0 },
  };

  for (const i of intervenciones) {
    const costo = costoNetoIntervencion(i);
    const tipos = i.tipos.filter((t) => t.dias > 0);
    const diasTotal = tipos.reduce((a, t) => a + t.dias, 0);
    const resto = costo.manoDeObra.neto + costo.materiales.neto;
    for (const t of tipos) {
      acc[t.tipo].fachadas.add(i.fachadaId);
      acc[t.tipo].dias += t.dias;
      acc[t.tipo].neto +=
        diasTotal > 0 ? resto * (t.dias / diasTotal) : resto / tipos.length;
    }
    if (i.requiereHojalateria || costo.hojalateria.neto > 0) {
      acc.hojalateria.fachadas.add(i.fachadaId);
      acc.hojalateria.neto += costo.hojalateria.neto;
    }
  }

  const keys: Array<TipoIntervencionFachada | "hojalateria"> = [
    ...TIPOS_INTERVENCION_FACHADA,
    "hojalateria",
  ];
  return keys.map((key) => ({
    key,
    fachadasN: acc[key].fachadas.size,
    dias: Math.round(acc[key].dias * 10) / 10,
    neto: Math.round(acc[key].neto),
  }));
}

export type QuienEjecutoDash = {
  maestrosFachadas: number;
  externosFachadas: number;
  maestrosNeto: number;
  externosNeto: number;
  maestrosM2: number;
  externosM2: number;
  maestrosCostoM2: number | null;
  externosCostoM2: number | null;
  intervenidas: number;
  pctMaestrosNeto: number | null;
  pctExternosNeto: number | null;
};

export function quienEjecuto(
  intervenciones: IntervencionIndicadores[],
): QuienEjecutoDash {
  const maestros = new Set<string>();
  const externos = new Set<string>();
  const maestrosM2Map = new Map<string, number>();
  const externosM2Map = new Map<string, number>();
  let maestrosNeto = 0;
  let externosNeto = 0;
  let maestrosNetoM2 = 0;
  let externosNetoM2 = 0;
  for (const i of intervenciones) {
    const neto = costoNetoIntervencion(i).totalNeto;
    const m2 = tieneSuperficieM2(i.superficieM2Snapshot)
      ? i.superficieM2Snapshot
      : null;
    if (i.ejecutadoPor === "maestros_bodetek") {
      maestros.add(i.fachadaId);
      maestrosNeto += neto;
      if (m2 != null) {
        maestrosM2Map.set(i.fachadaId, m2);
        maestrosNetoM2 += neto;
      }
    } else if (i.ejecutadoPor === "proveedor_externo") {
      externos.add(i.fachadaId);
      externosNeto += neto;
      if (m2 != null) {
        externosM2Map.set(i.fachadaId, m2);
        externosNetoM2 += neto;
      }
    }
  }
  const totalNeto = maestrosNeto + externosNeto;
  const intervenidas = new Set([...maestros, ...externos]).size;
  const maestrosM2 = [...maestrosM2Map.values()].reduce((a, n) => a + n, 0);
  const externosM2 = [...externosM2Map.values()].reduce((a, n) => a + n, 0);
  return {
    maestrosFachadas: maestros.size,
    externosFachadas: externos.size,
    maestrosNeto: Math.round(maestrosNeto),
    externosNeto: Math.round(externosNeto),
    maestrosM2,
    externosM2,
    maestrosCostoM2: maestrosM2 > 0 ? Math.round(maestrosNetoM2 / maestrosM2) : null,
    externosCostoM2: externosM2 > 0 ? Math.round(externosNetoM2 / externosM2) : null,
    intervenidas,
    pctMaestrosNeto:
      totalNeto > 0 ? Math.round((maestrosNeto / totalNeto) * 100) : null,
    pctExternosNeto:
      totalNeto > 0 ? Math.round((externosNeto / totalNeto) * 100) : null,
  };
}

export type UltimaIntervencionDash = {
  id: string;
  fachadaId: string;
  fecha: string | null;
  tipos: TipoIntervencionFachada[];
  hojalateria: boolean;
  ejecutadoPor: IntervencionIndicadores["ejecutadoPor"];
  proveedorId: string | null;
  totalNeto: number;
};

export function ultimasIntervenciones(
  intervenciones: IntervencionIndicadores[],
  limite = 3,
): UltimaIntervencionDash[] {
  return intervenciones
    .slice()
    .sort((a, b) =>
      (b.fechaTermino || b.fechaInicio || "").localeCompare(
        a.fechaTermino || a.fechaInicio || "",
      ),
    )
    .slice(0, limite)
    .map((i) => ({
      id: i.id,
      fachadaId: i.fachadaId,
      fecha: i.fechaTermino || i.fechaInicio,
      tipos: i.tipos.filter((t) => t.dias > 0).map((t) => t.tipo),
      hojalateria: i.requiereHojalateria,
      ejecutadoPor: i.ejecutadoPor,
      proveedorId: i.proveedorId ?? null,
      totalNeto: costoNetoIntervencion(i).totalNeto,
    }));
}

export type FilaTablaFachada = {
  id: string;
  etiqueta: string;
  recinto: string;
  m2: number | null;
  ultimaLabel: string | null;
  ultimaIso: string | null;
  tipos: Array<TipoIntervencionFachada | "hojalateria">;
  ejecutor: string | null;
  docsLabel: string;
  estado: EstadoCalculadoFachada;
  fotoUrl: string | null;
};

export function filasTablaFachadas(
  fachadas: FachadaListadoItem[],
  intervenciones: IntervencionIndicadores[],
  hoy = hoyIsoChile(),
): FilaTablaFachada[] {
  return fachadas.map((f) => {
    const propias = intervenciones.filter((i) => i.fachadaId === f.id);
    const ultima = propias
      .slice()
      .sort((a, b) =>
        (b.fechaTermino || b.fechaInicio || "").localeCompare(
          a.fechaTermino || a.fechaInicio || "",
        ),
      )[0];
    const tipos = new Set<TipoIntervencionFachada | "hojalateria">();
    let cot = 0;
    let fact = 0;
    for (const i of propias) {
      for (const t of i.tipos) {
        if (t.dias > 0) tipos.add(t.tipo);
      }
      if (i.requiereHojalateria) tipos.add("hojalateria");
      for (const d of i.documentos ?? []) {
        if (d.tipoDocumento === "cotizacion") cot += 1;
        if (d.tipoDocumento === "factura" || d.tipoDocumento === "boleta") fact += 1;
      }
    }
    let docsLabel = "Sin documentos";
    if (cot && !fact) {
      docsLabel = `${cot} cot. · sin factura`;
    } else if (cot || fact) {
      const partes: string[] = [];
      if (cot) partes.push(`${cot} cot.`);
      if (fact) partes.push(`${fact} factura${fact === 1 ? "" : "s"}`);
      docsLabel = partes.join(" · ");
    }
    return {
      id: f.id,
      etiqueta: f.nombre,
      recinto: f.nombre,
      m2: f.superficieM2,
      ultimaLabel: ultima
        ? ultima.estado === "en_ejecucion"
          ? "En curso"
          : ultima.fechaTermino || ultima.fechaInicio
        : null,
      ultimaIso: ultima?.fechaTermino || ultima?.fechaInicio || null,
      tipos: [...tipos],
      ejecutor: ultima?.ejecutadoPor ?? null,
      docsLabel,
      estado: estadoDeListado(f, intervenciones, hoy),
      fotoUrl: f.fotoUrl,
    };
  });
}

export function filtrarFachadasPorRecinto(
  fachadas: FachadaListadoItem[],
  recintoId: string | null,
): FachadaListadoItem[] {
  if (!recintoId) return fachadas;
  return fachadas.filter((f) => f.recintoId === recintoId);
}

export function sitioDesdeSvg(svgId: string | null | undefined): string | null {
  const sitio = svgId?.match(/^s(\d+)-/)?.[1];
  return sitio ? `Sitio ${sitio}` : null;
}

export function textoEncabezadoFachadas(
  fachadas: Pick<FachadaListadoItem, "svgId" | "ubicacion">[],
): string {
  const sitios = new Set(
    fachadas.map((fachada) => fachada.svgId?.match(/^s(\d+)-/)?.[1]).filter(Boolean),
  );
  const exteriores = fachadas.filter((fachada) => fachada.ubicacion === "exterior").length;
  const interiores = fachadas.filter((fachada) => fachada.ubicacion === "interior").length;
  return `${fachadas.length} fachadas en ${sitios.size} sitios (${exteriores} exteriores, ${interiores} interiores)`;
}

export type FilaAgrupadaFachada = {
  id: string;
  nombre: string;
  unidadLabel: string;
  sitio: string | null;
  ubicacion: UbicacionFachada | null;
  hacia: string | null;
  m2: number | null;
  estado: EstadoPlano;
  ultimaIso: string | null;
  costoNeto: number | null;
  orden: number;
};

export type GrupoUnidadFachadas = {
  unidadLabel: string;
  sitio: string | null;
  filas: FilaAgrupadaFachada[];
};

export function agruparFachadasPorUnidad(
  fachadas: FachadaListadoItem[],
  intervenciones: IntervencionIndicadores[],
  opciones: {
    hoy: string;
    comoAntes?: boolean;
    inicio?: string;
    haciaPorSvgId?: Readonly<Record<string, string>>;
  },
): GrupoUnidadFachadas[] {
  const filas = fachadas.map((fachada) => {
    const propias = intervenciones.filter((intervencion) => intervencion.fachadaId === fachada.id);
    const estado = opciones.comoAntes
      ? estadoAFecha(fachada, intervenciones, opciones.inicio ?? opciones.hoy)
      : estadoPlano(fachada, intervenciones, opciones.hoy);
    const ultima = propias.slice().sort((a, b) =>
      (b.fechaTermino || b.fechaInicio || "").localeCompare(a.fechaTermino || a.fechaInicio || ""),
    )[0];
    const costo = propias.reduce((total, intervencion) => total + costoNetoIntervencion(intervencion).totalNeto, 0);
    return {
      id: fachada.id,
      nombre: fachada.nombre,
      unidadLabel: (fachada.unidadLabel ?? "").trim() || "Sin unidad",
      sitio: sitioDesdeSvg(fachada.svgId),
      ubicacion: fachada.ubicacion ?? null,
      hacia: fachada.svgId ? opciones.haciaPorSvgId?.[fachada.svgId] ?? null : null,
      m2: fachada.superficieM2,
      estado,
      ultimaIso: ultima?.fechaTermino || ultima?.fechaInicio || null,
      costoNeto: propias.length > 0 ? Math.round(costo) : null,
      orden: fachada.orden ?? 0,
    };
  });
  filas.sort((a, b) => {
    const unidad = a.unidadLabel.localeCompare(b.unidadLabel, "es");
    if (unidad !== 0) return unidad;
    if (a.orden !== b.orden) return a.orden - b.orden;
    return a.nombre.localeCompare(b.nombre, "es");
  });
  const grupos: GrupoUnidadFachadas[] = [];
  for (const fila of filas) {
    const actual = grupos[grupos.length - 1];
    if (actual && actual.unidadLabel === fila.unidadLabel) {
      actual.filas.push(fila);
    } else {
      grupos.push({ unidadLabel: fila.unidadLabel, sitio: fila.sitio, filas: [fila] });
    }
  }
  return grupos;
}

export function filtrarDashboard(
  intervenciones: IntervencionIndicadores[],
  filtro: FiltroDashboardFachadas,
): IntervencionIndicadores[] {
  return filtrarIntervenciones(intervenciones, filtro);
}

export { ESTADOS_CALCULADOS_FACHADA };
